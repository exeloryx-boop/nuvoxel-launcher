use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD, Engine};
use futures::stream::{self, StreamExt};
use reqwest::Client;
use serde_json::Value;
use sha1_smol::Sha1;
use tauri::{AppHandle, Emitter};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::sync::Semaphore;

use crate::app_meta;

use super::LaunchProgress;

const MANIFEST_URL: &str =
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

pub async fn fetch_version_url(client: &Client, version_id: &str) -> Result<String, String> {
    let manifest = fetch_json(client, MANIFEST_URL).await?;

    let versions = manifest["versions"]
        .as_array()
        .ok_or("Неверный формат манифеста")?;

    for v in versions {
        if v["id"].as_str() == Some(version_id) {
            return v["url"]
                .as_str()
                .map(str::to_string)
                .ok_or_else(|| format!("URL для версии {version_id} не найден"));
        }
    }

    Err(format!("Версия Minecraft {version_id} не найдена"))
}

pub async fn fetch_json(client: &Client, url: &str) -> Result<Value, String> {
    let response = client
        .get(url)
        .header("User-Agent", app_meta::user_agent())
        .send()
        .await
        .map_err(|e| format!("Ошибка загрузки {url}: {e}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("Ошибка чтения ответа ({url}): {e}"))?;

    if !status.is_success() {
        let snippet: String = body.chars().take(160).collect();
        return Err(format!("HTTP {status} ({url}): {snippet}"));
    }

    serde_json::from_str(&body).map_err(|e| {
        format!(
            "Ошибка JSON ({url}): {e} | {}",
            body.chars().take(120).collect::<String>()
        )
    })
}

pub async fn ensure_version_json(
    client: &Client,
    game_dir: &Path,
    version_id: &str,
    version_url: &str,
) -> Result<Value, String> {
    let version_dir = game_dir.join("versions").join(version_id);
    fs::create_dir_all(&version_dir)
        .await
        .map_err(|e| e.to_string())?;
    let json_path = version_dir.join(format!("{version_id}.json"));

    if json_path.exists() {
        let content = fs::read_to_string(&json_path)
            .await
            .map_err(|e| e.to_string())?;
        return serde_json::from_str(&content).map_err(|e| e.to_string());
    }

    let version_json = fetch_json(client, version_url).await?;
    fs::write(
        &json_path,
        serde_json::to_string_pretty(&version_json).unwrap_or_default(),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(version_json)
}

pub async fn save_version_json(
    game_dir: &Path,
    version_id: &str,
    version_json: &Value,
) -> Result<(), String> {
    let version_dir = game_dir.join("versions").join(version_id);
    fs::create_dir_all(&version_dir)
        .await
        .map_err(|e| e.to_string())?;
    let json_path = version_dir.join(format!("{version_id}.json"));
    fs::write(
        &json_path,
        serde_json::to_string_pretty(version_json).unwrap_or_default(),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn ensure_vanilla_base(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    verify: bool,
) -> Result<(), String> {
    let url = fetch_version_url(client, mc_version).await?;
    let json = fetch_json(client, &url).await?;
    save_version_json(game_dir, mc_version, &json).await?;
    download_client(client, game_dir, mc_version, &json, verify).await?;
    Ok(())
}

pub async fn resolve_inherited_version(
    client: &Client,
    game_dir: &Path,
    version_json: &Value,
) -> Result<Value, String> {
    let Some(parent_id) = version_json.get("inheritsFrom").and_then(|v| v.as_str()) else {
        return Ok(version_json.clone());
    };

    let parent_url = fetch_version_url(client, parent_id).await?;
    let parent_json = ensure_version_json(client, game_dir, parent_id, &parent_url).await?;
    let merged_parent = Box::pin(resolve_inherited_version(client, game_dir, &parent_json)).await?;
    Ok(merge_version_json(merged_parent, version_json))
}

fn merge_version_json(base: Value, overlay: &Value) -> Value {
    let mut merged = base;

    if let Some(id) = overlay.get("id") {
        merged["id"] = id.clone();
    }
    if let Some(main_class) = overlay.get("mainClass") {
        merged["mainClass"] = main_class.clone();
    }
    if let Some(version_type) = overlay.get("type") {
        merged["type"] = version_type.clone();
    }
    if let Some(asset_index) = overlay.get("assetIndex") {
        merged["assetIndex"] = asset_index.clone();
    }
    if let Some(downloads) = overlay.get("downloads") {
        if !downloads.is_null() {
            merged["downloads"] = downloads.clone();
        }
    }
    if let Some(arguments) = overlay.get("arguments") {
        if let Some(base_args) = merged.get("arguments").and_then(|v| v.as_object()) {
            let mut merged_args = base_args.clone();
            if let Some(overlay_obj) = arguments.as_object() {
                for (key, value) in overlay_obj {
                    if key == "jvm" || key == "game" {
                        if let Some(base_arr) = merged_args.get(key).and_then(|v| v.as_array()) {
                            let mut combined = base_arr.clone();
                            if let Some(overlay_arr) = value.as_array() {
                                combined.extend(overlay_arr.iter().cloned());
                            }
                            merged_args.insert(key.clone(), Value::Array(combined));
                        } else {
                            merged_args.insert(key.clone(), value.clone());
                        }
                    } else {
                        merged_args.insert(key.clone(), value.clone());
                    }
                }
            }
            merged["arguments"] = Value::Object(merged_args);
        } else {
            merged["arguments"] = arguments.clone();
        }
    }
    if let Some(minecraft_arguments) = overlay.get("minecraftArguments") {
        merged["minecraftArguments"] = minecraft_arguments.clone();
    }
    if let Some(logging) = overlay.get("logging") {
        merged["logging"] = logging.clone();
    }

    if let Some(overlay_libs) = overlay["libraries"].as_array() {
        let mut libs = merged["libraries"]
            .as_array()
            .cloned()
            .unwrap_or_default();
        for lib in overlay_libs {
            if let Some((group, artifact)) = lib["name"]
                .as_str()
                .and_then(maven_coordinate_key)
            {
                libs.retain(|existing| {
                    existing["name"]
                        .as_str()
                        .and_then(maven_coordinate_key)
                        .map(|(g, a)| g != group || a != artifact)
                        .unwrap_or(true)
                });
            } else {
                let name = lib["name"].as_str().unwrap_or("");
                libs.retain(|existing| existing["name"].as_str() != Some(name));
            }
            libs.push(lib.clone());
        }
        merged["libraries"] = Value::Array(libs);
    }

    merged.as_object_mut().map(|obj| {
        obj.remove("inheritsFrom");
    });

    if let Some(libs) = merged.get_mut("libraries").and_then(|v| v.as_array_mut()) {
        *libs = dedupe_libraries_json(std::mem::take(libs));
    }

    merged
}

fn maven_library_dedupe_key(name: &str) -> Option<(String, String, String)> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() < 3 {
        return None;
    }
    let classifier = parts.get(3).copied().unwrap_or("").to_string();
    Some((parts[0].to_string(), parts[1].to_string(), classifier))
}

pub fn dedupe_libraries_json(libraries: Vec<Value>) -> Vec<Value> {
    let mut result: Vec<Value> = Vec::new();
    let mut index_by_key: HashMap<(String, String, String), usize> = HashMap::new();

    for lib in libraries {
        if let Some(name) = lib["name"].as_str() {
            if let Some(key) = maven_library_dedupe_key(name) {
                if let Some(&idx) = index_by_key.get(&key) {
                    result[idx] = lib;
                } else {
                    index_by_key.insert(key, result.len());
                    result.push(lib);
                }
                continue;
            }
            if let Some(idx) = result
                .iter()
                .position(|existing| existing["name"].as_str() == Some(name))
            {
                result[idx] = lib;
            } else {
                result.push(lib);
            }
        } else {
            result.push(lib);
        }
    }

    result
}

pub async fn download_file(
    client: &Client,
    url: &str,
    dest: &Path,
    expected_sha1: Option<&str>,
    verify: bool,
) -> Result<(), String> {
    download_file_with_mirrors(client, &[url.to_string()], dest, expected_sha1, verify).await
}

pub async fn download_file_with_mirrors(
    client: &Client,
    urls: &[String],
    dest: &Path,
    expected_sha1: Option<&str>,
    verify: bool,
) -> Result<(), String> {
    if dest.exists() {
        if verify {
            if let Some(expected) = expected_sha1 {
                if file_sha1(dest).await? == expected {
                    return Ok(());
                }
            } else {
                return Ok(());
            }
        } else {
            return Ok(());
        }
    }

    if urls.is_empty() {
        return Err(format!("Нет URL для {}", dest.display()));
    }

    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
    }

    let mut last_err = String::new();
    for url in urls {
        match download_file_once(client, url, dest, expected_sha1, verify).await {
            Ok(()) => return Ok(()),
            Err(e) => last_err = e,
        }
    }

    Err(if last_err.is_empty() {
        format!("Не удалось загрузить {}", dest.display())
    } else {
        last_err
    })
}

async fn download_file_once(
    client: &Client,
    url: &str,
    dest: &Path,
    expected_sha1: Option<&str>,
    verify: bool,
) -> Result<(), String> {
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Загрузка не удалась: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {} для {url}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Ошибка чтения данных: {e}"))?;

    if verify {
        if let Some(expected) = expected_sha1 {
            let hash = sha1_hex(&bytes);
            if hash != expected {
                return Err(format!(
                    "Контрольная сумма не совпадает для {}",
                    dest.display()
                ));
            }
        }
    }

    let mut file = fs::File::create(dest).await.map_err(|e| e.to_string())?;
    file.write_all(&bytes).await.map_err(|e| e.to_string())?;
    Ok(())
}

async fn file_sha1(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).await.map_err(|e| e.to_string())?;
    Ok(sha1_hex(&bytes))
}

fn sha1_hex(data: &[u8]) -> String {
    let mut hasher = Sha1::new();
    hasher.update(data);
    hasher.digest().to_string()
}

fn rule_matches(rules: Option<&Value>, os: &str) -> bool {
    let Some(rules) = rules.and_then(|v| v.as_array()) else {
        return true;
    };
    if rules.is_empty() {
        return true;
    }
    let mut allow = false;
    for rule in rules {
        let action_allow = rule["action"].as_str() != Some("disallow");
        let os_match = rule
            .get("os")
            .and_then(|o| o.get("name"))
            .and_then(|n| n.as_str())
            .map(|n| n == os)
            .unwrap_or(true);
        if os_match {
            allow = action_allow;
        }
    }
    allow
}

pub struct LibraryArtifacts {
    pub classpath: Vec<PathBuf>,
    pub native_jars: Vec<PathBuf>,
}

pub fn collect_library_paths(
    game_dir: &Path,
    version_json: &Value,
) -> Result<LibraryArtifacts, String> {
    let mut classpath = Vec::new();
    let mut native_jars = Vec::new();
    let libraries = dedupe_libraries_json(
        version_json["libraries"]
            .as_array()
            .ok_or("Нет списка библиотек")?
            .clone(),
    );

    for lib in &libraries {
        if !rule_matches(lib.get("rules"), "windows") {
            continue;
        }

        if should_collect_native_library(lib, "windows") {
            push_native_jar_from_lib(&mut native_jars, game_dir, lib)?;
            continue;
        }

        if library_has_maven_classifier(lib) {
            continue;
        }

        if let Some(path) = library_jar_path(game_dir, lib)? {
            if is_runtime_classpath_jar(&path) {
                classpath.push(path);
            }
        }

        if let Some(classifiers) = lib["downloads"].get("classifiers") {
            if let Some(native_key) = resolve_native_classifier_key(lib, "windows") {
                if let Some(native) = classifiers.get(&native_key) {
                    if let Some(url) = native["url"].as_str() {
                        if let Some(path) = native_path_from_url(game_dir, url) {
                            native_jars.push(path);
                        }
                    }
                }
            }
        }
    }

    Ok(LibraryArtifacts {
        classpath: dedupe_library_jars(classpath),
        native_jars,
    })
}

pub async fn download_client(
    client: &Client,
    game_dir: &Path,
    version_id: &str,
    version_json: &Value,
    verify: bool,
) -> Result<Option<PathBuf>, String> {
    if version_id.contains("-forge-") || version_id.contains("-neoforge-") {
        return Ok(None);
    }

    let Some(client_dl) = version_json.get("downloads").and_then(|d| d.get("client")) else {
        return Ok(None);
    };
    let url = client_dl["url"]
        .as_str()
        .ok_or("URL клиента не найден")?;
    let sha1 = client_dl["sha1"].as_str();
    let jar_version = version_json
        .get("inheritsFrom")
        .and_then(|v| v.as_str())
        .unwrap_or(version_id);
    let jar_path = game_dir
        .join("versions")
        .join(jar_version)
        .join(format!("{jar_version}.jar"));
    download_file(client, url, &jar_path, sha1, verify).await?;
    Ok(Some(jar_path))
}

pub async fn download_all_libraries(
    app: &AppHandle,
    client: &Client,
    game_dir: &Path,
    version_json: &Value,
    verify: bool,
    concurrency: usize,
) -> Result<LibraryArtifacts, String> {
    let mut downloads: Vec<(Vec<String>, PathBuf, Option<String>)> = Vec::new();
    let libraries = dedupe_libraries_json(
        version_json["libraries"]
            .as_array()
            .ok_or("Нет списка библиотек")?
            .clone(),
    );

    for lib in &libraries {
        if !rule_matches(lib.get("rules"), "windows") {
            continue;
        }

        if let Some(entry) = library_download_entry(game_dir, lib)? {
            downloads.push(entry);
        }

        if library_has_maven_classifier(lib) {
            continue;
        }

        if let Some(classifiers) = lib["downloads"].get("classifiers") {
            if let Some(native_key) = resolve_native_classifier_key(lib, "windows") {
                if let Some(native) = classifiers.get(&native_key) {
                    let url = native["url"].as_str().unwrap_or("");
                    if !url.is_empty() {
                        if let Some(path) = native_path_from_url(game_dir, url) {
                            let sha1 = native["sha1"].as_str().map(str::to_string);
                            let repo_path = maven_repo_path_from_url(url);
                            let urls = library_download_urls(Some(url), repo_path.as_deref());
                            downloads.push((urls, path, sha1));
                        }
                    }
                }
            }
        }
    }

    let total = downloads.len();
    let done = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let sem = Arc::new(Semaphore::new(concurrency.max(1)));

    stream::iter(downloads)
        .map(|(urls, path, sha1)| {
            let client = client.clone();
            let app = app.clone();
            let sem = sem.clone();
            let done = done.clone();
            async move {
                let _permit = sem.acquire().await.unwrap();
                download_file_with_mirrors(
                    &client,
                    &urls,
                    &path,
                    sha1.as_deref(),
                    verify,
                )
                .await?;
                let n = done.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
                let _ = app.emit(
                    "launch-progress",
                    LaunchProgress {
                        stage: "libraries".into(),
                        n: Some(n as u32),
                        total: Some(total as u32),
                        percent: Some((n * 100 / total.max(1)) as u8),
                    },
                );
                Ok::<(), String>(())
            }
        })
        .buffer_unordered(concurrency.max(1))
        .collect::<Vec<Result<(), String>>>()
        .await
        .into_iter()
        .collect::<Result<(), String>>()?;

    let missing = missing_runtime_libraries(game_dir, version_json);
    if !missing.is_empty() {
        return Err(format!(
            "ERR_LIBS_MISSING:{}",
            missing
                .iter()
                .take(5)
                .map(|p| p.display().to_string())
                .collect::<Vec<_>>()
                .join(";")
        ));
    }

    collect_library_paths(game_dir, version_json)
}

fn missing_runtime_libraries(game_dir: &Path, version_json: &Value) -> Vec<PathBuf> {
    let mut missing = Vec::new();
    let libraries = dedupe_libraries_json(
        version_json["libraries"]
            .as_array()
            .cloned()
            .unwrap_or_default(),
    );

    for lib in &libraries {
        if !rule_matches(lib.get("rules"), "windows") {
            continue;
        }
        if library_has_maven_classifier(lib) {
            continue;
        }
        let Ok(Some(path)) = library_jar_path(game_dir, lib) else {
            continue;
        };
        if is_runtime_classpath_jar(&path) && !path.exists() {
            missing.push(path);
        }
    }

    missing
}

pub async fn extract_natives(
    game_dir: &Path,
    version_id: &str,
    native_jars: &[PathBuf],
) -> Result<PathBuf, String> {
    let game_dir = game_dir.to_path_buf();
    let version_id = version_id.to_string();
    let native_jars = native_jars.to_vec();

    tokio::task::spawn_blocking(move || extract_natives_sync(&game_dir, &version_id, &native_jars))
        .await
        .map_err(|e| e.to_string())?
}

fn extract_natives_sync(
    game_dir: &Path,
    version_id: &str,
    native_jars: &[PathBuf],
) -> Result<PathBuf, String> {
    let natives_dir = game_dir
        .join("versions")
        .join(version_id)
        .join("natives");

    if natives_dir.exists() {
        std::fs::remove_dir_all(&natives_dir).map_err(|e| e.to_string())?;
    }
    std::fs::create_dir_all(&natives_dir).map_err(|e| e.to_string())?;

    let mut extracted = 0usize;
    for jar_path in native_jars {
        if !jar_path.exists() {
            continue;
        }
        let file = std::fs::File::open(jar_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
        for i in 0..archive.len() {
            let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
            let name = entry.name().to_string();
            if entry.is_dir() {
                continue;
            }
            let file_name = Path::new(&name)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");
            if file_name.ends_with(".dll")
                || file_name.ends_with(".so")
                || file_name.ends_with(".dylib")
            {
                let out_path = natives_dir.join(file_name);
                let mut buf = Vec::new();
                std::io::Read::read_to_end(&mut entry, &mut buf).map_err(|e| e.to_string())?;
                std::fs::write(&out_path, &buf).map_err(|e| e.to_string())?;
                extracted += 1;
            }
        }
    }

    if extracted == 0 && !native_jars.is_empty() {
        return Err(format!(
            "ERR_NATIVES_EMPTY:{}",
            natives_dir.display()
        ));
    }

    #[cfg(target_os = "windows")]
    if !native_jars.is_empty() && !natives_dir.join("lwjgl.dll").exists() {
        return Err(format!(
            "ERR_NATIVES_EMPTY:{}",
            natives_dir.display()
        ));
    }

    Ok(natives_dir)
}

pub async fn download_assets(
    app: &AppHandle,
    client: &Client,
    game_dir: &Path,
    version_json: &Value,
    verify: bool,
    concurrency: usize,
) -> Result<(), String> {
    let asset_index = &version_json["assetIndex"];
    let index_id = asset_index["id"].as_str().ok_or("assetIndex.id отсутствует")?;
    let index_url = asset_index["url"].as_str().ok_or("assetIndex.url отсутствует")?;
    let index_path = game_dir
        .join("assets")
        .join("indexes")
        .join(format!("{index_id}.json"));
    download_file(client, index_url, &index_path, None, false).await?;

    let index_content = fs::read_to_string(&index_path)
        .await
        .map_err(|e| e.to_string())?;
    let index: Value = serde_json::from_str(&index_content).map_err(|e| e.to_string())?;
    let objects = index["objects"]
        .as_object()
        .ok_or("Неверный asset index")?;

    let mut downloads = Vec::new();
    for (_name, obj) in objects {
        let hash = obj["hash"].as_str().unwrap_or("");
        if hash.is_empty() {
            continue;
        }
        let prefix = &hash[..2];
        let dest = game_dir
            .join("assets")
            .join("objects")
            .join(prefix)
            .join(hash);
        if dest.exists() {
            continue;
        }
        let url = format!("https://resources.download.minecraft.net/{prefix}/{hash}");
        downloads.push((url, dest, hash.to_string()));
    }

    let total = downloads.len();
    if total == 0 {
        return Ok(());
    }

    let done = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let sem = Arc::new(Semaphore::new(concurrency.max(1)));

    stream::iter(downloads)
        .map(|(url, path, hash)| {
            let client = client.clone();
            let app = app.clone();
            let sem = sem.clone();
            let done = done.clone();
            async move {
                let _permit = sem.acquire().await.unwrap();
                download_file(&client, &url, &path, Some(&hash), verify).await?;
                let n = done.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
                if n % 50 == 0 || n == total {
                    let _ = app.emit(
                        "launch-progress",
                        LaunchProgress {
                            stage: "assets".into(),
                            n: Some(n as u32),
                            total: Some(total as u32),
                            percent: Some((n * 100 / total) as u8),
                        },
                    );
                }
                Ok::<(), String>(())
            }
        })
        .buffer_unordered(concurrency.max(1))
        .collect::<Vec<Result<(), String>>>()
        .await
        .into_iter()
        .collect::<Result<(), String>>()?;

    Ok(())
}

pub async fn apply_skin(
    client: &Client,
    game_dir: &Path,
    username: &str,
    skin_username: Option<&str>,
    skin_model: Option<&str>,
    cape_username: Option<&str>,
    custom_skin_data: Option<&str>,
    custom_cape_data: Option<&str>,
) -> Result<(), String> {
    let skins_dir = game_dir.join("skins");
    fs::create_dir_all(&skins_dir)
        .await
        .map_err(|e| e.to_string())?;

    let bytes = if let Some(data) = custom_skin_data.filter(|data| !data.is_empty()) {
        decode_uploaded_png(data)?
    } else {
        let skin_name = skin_username
            .filter(|name| !name.is_empty())
            .ok_or("ERR_SKIN_MISSING")?;
        let url = format!(
            "https://mc-heads.net/skin/{}",
            urlencoding_encode(skin_name)
        );
        let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
        if !response.status().is_success() {
            return Err(format!("ERR_SKIN_DOWNLOAD:{}", response.status()));
        }
        response.bytes().await.map_err(|e| e.to_string())?.to_vec()
    };

    let offline = super::uuid_util::offline_uuid(username);
    let paths = [
        skins_dir.join(format!("{username}.png")),
        skins_dir.join(format!("{offline}.png")),
    ];

    for path in paths {
        fs::write(&path, &bytes).await.map_err(|e| e.to_string())?;
    }

    let csl_skin_dir = game_dir.join("CustomSkinLoader").join("LocalSkin");
    fs::create_dir_all(&csl_skin_dir)
        .await
        .map_err(|e| e.to_string())?;
    fs::write(csl_skin_dir.join(format!("{username}.png")), &bytes)
        .await
        .map_err(|e| e.to_string())?;

    let model = if skin_model == Some("slim") {
        "slim"
    } else {
        "classic"
    };
    let meta = serde_json::json!({ "model": model, "username": username });
    let meta_paths = [
        skins_dir.join(format!("{username}.json")),
        skins_dir.join(format!("{offline}.json")),
    ];
    for path in meta_paths {
        fs::write(&path, serde_json::to_string(&meta).unwrap_or_default())
            .await
            .map_err(|e| e.to_string())?;
    }
    fs::write(
        csl_skin_dir.join(format!("{username}.json")),
        serde_json::to_string(&meta).unwrap_or_default(),
    )
    .await
    .map_err(|e| e.to_string())?;

    write_custom_skin_loader_config(game_dir).await?;

    let cape_bytes = if let Some(data) = custom_cape_data.filter(|data| !data.is_empty()) {
        Some(decode_uploaded_png(data)?)
    } else if let Some(cape_name) = cape_username.filter(|name| !name.is_empty()) {
        let cape_url = format!(
            "https://mc-heads.net/cape/{}",
            urlencoding_encode(cape_name)
        );
        match client.get(&cape_url).send().await {
            Ok(response) if response.status().is_success() => {
                response.bytes().await.ok().map(|bytes| bytes.to_vec())
            }
            _ => None,
        }
    } else {
        None
    };

    if let Some(bytes) = cape_bytes {
        let capes_dir = game_dir.join("capes");
        let csl_dir = game_dir
            .join("CustomSkinLoader")
            .join("LocalSkin")
            .join("capes");
        fs::create_dir_all(&capes_dir)
            .await
            .map_err(|e| e.to_string())?;
        fs::create_dir_all(&csl_dir).await.map_err(|e| e.to_string())?;

        let cape_paths = [
            capes_dir.join(format!("{username}.png")),
            capes_dir.join(format!("{offline}.png")),
            csl_dir.join(format!("{username}.png")),
        ];
        for path in cape_paths {
            fs::write(&path, &bytes).await.map_err(|e| e.to_string())?;
        }

        let cape_meta = serde_json::json!({
            "cape": cape_username.unwrap_or("custom"),
            "username": username
        });
        fs::write(
            capes_dir.join(format!("{offline}.json")),
            serde_json::to_string(&cape_meta).unwrap_or_default(),
        )
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn decode_uploaded_png(data_url: &str) -> Result<Vec<u8>, String> {
    const PREFIX: &str = "data:image/png;base64,";
    const MAX_DATA_URL_LEN: usize = 2_800_000;
    const PNG_MAGIC: &[u8] = b"\x89PNG\r\n\x1a\n";

    if data_url.len() > MAX_DATA_URL_LEN {
        return Err("ERR_CUSTOM_APPEARANCE_TOO_LARGE".into());
    }
    let encoded = data_url
        .strip_prefix(PREFIX)
        .ok_or("ERR_CUSTOM_APPEARANCE_FORMAT")?;
    let bytes = STANDARD
        .decode(encoded)
        .map_err(|_| "ERR_CUSTOM_APPEARANCE_FORMAT")?;
    if bytes.len() > 2 * 1024 * 1024 || !bytes.starts_with(PNG_MAGIC) {
        return Err("ERR_CUSTOM_APPEARANCE_FORMAT".into());
    }
    Ok(bytes)
}

const CSL_MODRINTH_PROJECT: &str = "customskinloader";

pub async fn ensure_custom_skin_loader(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    loader: &str,
) -> Result<(), String> {
    let mods_dir = game_dir.join("mods");
    fs::create_dir_all(&mods_dir)
        .await
        .map_err(|e| e.to_string())?;

    let mut has_csl = false;
    if let Ok(mut entries) = fs::read_dir(&mods_dir).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            let name = entry.file_name().to_string_lossy().to_lowercase();
            if name.contains("customskinloader") && name.ends_with(".jar") {
                has_csl = true;
                break;
            }
        }
    }

    if !has_csl {
        let loader_param = match loader {
            "quilt" => "quilt",
            "forge" => "forge",
            "neoforge" => "neoforge",
            _ => "fabric",
        };
        let url = format!(
            "https://api.modrinth.com/v2/project/{CSL_MODRINTH_PROJECT}/version?loaders=[\"{loader_param}\"]&game_versions=[\"{mc_version}\"]"
        );
        let versions = fetch_json(client, &url).await?;
        let first = versions
            .as_array()
            .and_then(|arr| arr.first())
            .ok_or_else(|| format!("ERR_CSL_NO_VERSION:{mc_version}"))?;
        let file = first["files"]
            .as_array()
            .and_then(|arr| arr.first())
            .ok_or("ERR_CSL_FILE")?;
        let download_url = file["url"].as_str().ok_or("ERR_CSL_URL")?;
        let filename = file["filename"]
            .as_str()
            .unwrap_or("CustomSkinLoader.jar");
        download_file(
            client,
            download_url,
            &mods_dir.join(filename),
            None,
            false,
        )
        .await?;
    }

    write_custom_skin_loader_config(game_dir).await
}

async fn write_custom_skin_loader_config(game_dir: &Path) -> Result<(), String> {
    let csl_dir = game_dir.join("CustomSkinLoader");
    let local_skin = csl_dir.join("LocalSkin");
    fs::create_dir_all(&local_skin)
        .await
        .map_err(|e| e.to_string())?;

    let config = serde_json::json!({
        "enable": true,
        "loadlist": [
            {
                "name": "LocalSkin",
                "type": "Legacy",
                "root": "LocalSkin/"
            }
        ]
    });

    fs::write(
        csl_dir.join("CustomSkinLoader.json"),
        serde_json::to_string_pretty(&config).unwrap_or_default(),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn urlencoding_encode(s: &str) -> String {
    s.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' || c == '~' {
                c.to_string()
            } else {
                format!("%{:02X}", c as u8)
            }
        })
        .collect()
}

fn library_download_entry(
    game_dir: &Path,
    lib: &Value,
) -> Result<Option<(Vec<String>, PathBuf, Option<String>)>, String> {
    let Some(path) = library_jar_path(game_dir, lib)? else {
        return Ok(None);
    };

    if let Some(artifact) = lib.get("downloads").and_then(|d| d.get("artifact")) {
        let sha1 = artifact["sha1"].as_str().map(str::to_string);
        let url = artifact["url"].as_str();
        let repo_path = artifact["path"].as_str();
        let urls = library_download_urls(url, repo_path);
        if !urls.is_empty() {
            return Ok(Some((urls, path, sha1)));
        }
    }

    if let Some(name) = lib.get("name").and_then(|n| n.as_str()) {
        let top_sha1 = lib.get("sha1").and_then(|s| s.as_str()).map(str::to_string);
        if lib.get("downloads").is_none() {
            if let Some(base_url) = lib.get("url").and_then(|u| u.as_str()).filter(|u| !u.is_empty())
            {
                if let Some(repo_path) = maven_name_to_repo_path(name) {
                    let primary =
                        format!("{}/{}", base_url.trim_end_matches('/'), repo_path);
                    let mut urls = vec![primary];
                    for mirror in library_mirror_urls(&repo_path) {
                        if !urls.iter().any(|u| u == &mirror) {
                            urls.push(mirror);
                        }
                    }
                    return Ok(Some((urls, path, top_sha1)));
                }
            }
        }
        if let Some(repo_path) = maven_name_to_repo_path(name) {
            return Ok(Some((library_mirror_urls(&repo_path), path, top_sha1)));
        }
    }

    Ok(None)
}

fn library_download_urls(primary_url: Option<&str>, repo_path: Option<&str>) -> Vec<String> {
    if let Some(url) = primary_url.filter(|u| !u.is_empty()) {
        if let Some(path) = maven_repo_path_from_url(url) {
            let mut urls = library_mirror_urls(&path);
            if !urls.iter().any(|candidate| candidate == url) {
                urls.insert(0, url.to_string());
            }
            return urls;
        }
        return vec![url.to_string()];
    }

    repo_path
        .map(|path| library_mirror_urls(path))
        .unwrap_or_default()
}

fn library_mirror_urls(repo_path: &str) -> Vec<String> {
    let mut urls = Vec::new();
    let mut push = |url: String| {
        if !urls.iter().any(|existing| existing == &url) {
            urls.push(url);
        }
    };

    push(format!("https://libraries.minecraft.net/{repo_path}"));

    if repo_path.starts_with("net/fabricmc/") {
        push(format!("https://maven.fabricmc.net/{repo_path}"));
    }
    if repo_path.starts_with("net/minecraftforge/")
        || repo_path.starts_with("cpw/mods/")
        || repo_path.starts_with("org/spongepowered/")
    {
        push(format!("https://maven.minecraftforge.net/{repo_path}"));
    }
    if repo_path.starts_with("net/neoforged/") {
        push(format!("https://maven.neoforged.net/releases/{repo_path}"));
    }

    push(format!("https://repo1.maven.org/maven2/{repo_path}"));
    urls
}

fn maven_repo_path_from_url(url: &str) -> Option<String> {
    const PREFIXES: &[&str] = &[
        "https://libraries.minecraft.net/",
        "http://libraries.minecraft.net/",
        "https://repo1.maven.org/maven2/",
        "http://repo1.maven.org/maven2/",
        "https://maven.fabricmc.net/",
        "http://maven.fabricmc.net/",
        "https://maven.minecraftforge.net/",
        "http://maven.minecraftforge.net/",
        "https://maven.neoforged.net/releases/",
        "http://maven.neoforged.net/releases/",
    ];

    for prefix in PREFIXES {
        if let Some(path) = url.strip_prefix(prefix) {
            return Some(path.to_string());
        }
    }

    url.split("/maven/")
        .nth(1)
        .map(|path| path.trim_start_matches('/').to_string())
}

fn maven_name_to_repo_path(name: &str) -> Option<String> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() < 3 {
        return None;
    }
    let group = parts[0].replace('.', "/");
    let artifact = parts[1];
    let version = parts[2];
    let classifier = parts.get(3).copied().unwrap_or("");
    let file_name = if classifier.is_empty() {
        format!("{artifact}-{version}.jar")
    } else {
        format!("{artifact}-{version}-{classifier}.jar")
    };
    Some(format!("{group}/{artifact}/{version}/{file_name}"))
}

fn library_jar_path(game_dir: &Path, lib: &Value) -> Result<Option<PathBuf>, String> {
    if let Some(path) = lib
        .get("downloads")
        .and_then(|d| d.get("artifact"))
        .and_then(|a| a.get("path"))
        .and_then(|p| p.as_str())
    {
        return Ok(Some(
            game_dir
                .join("libraries")
                .join(path.replace('/', std::path::MAIN_SEPARATOR_STR)),
        ));
    }
    let name = lib["name"].as_str().ok_or("library без name")?;
    Ok(Some(maven_to_path(game_dir, name)))
}

fn maven_to_path(game_dir: &Path, name: &str) -> PathBuf {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() >= 3 {
        let group = parts[0].replace('.', "/");
        let artifact = parts[1];
        let version = parts[2];
        let classifier = parts.get(3).copied().unwrap_or("");
        let file_name = if classifier.is_empty() {
            format!("{artifact}-{version}.jar")
        } else {
            format!("{artifact}-{version}-{classifier}.jar")
        };
        return game_dir
            .join("libraries")
            .join(group)
            .join(artifact)
            .join(version)
            .join(file_name);
    }
    game_dir.join("libraries").join(format!("{name}.jar"))
}

fn native_path_from_url(game_dir: &Path, url: &str) -> Option<PathBuf> {
    let path_part = maven_repo_path_from_url(url)?;
    Some(
        game_dir
            .join("libraries")
            .join(path_part.replace('/', std::path::MAIN_SEPARATOR_STR)),
    )
}

fn resolve_native_classifier_key(lib: &Value, os: &str) -> Option<String> {
    let template = lib
        .get("natives")
        .and_then(|n| n.get(os))
        .and_then(|v| v.as_str())?;

    if template.contains("${arch}") {
        #[cfg(target_arch = "x86_64")]
        let arch = "x64";
        #[cfg(target_arch = "aarch64")]
        let arch = "arm64";
        #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
        let arch = "x64";
        Some(template.replace("${arch}", arch))
    } else {
        Some(template.to_string())
    }
}

fn normalize_library_path(path: &Path) -> PathBuf {
    PathBuf::from(
        path.to_string_lossy()
            .replace('/', std::path::MAIN_SEPARATOR_STR),
    )
}

/// Maven coords with a classifier (e.g. `:natives-windows`) are native artifacts — not classpath jars.
fn library_has_maven_classifier(lib: &Value) -> bool {
    lib["name"]
        .as_str()
        .map(|name| {
            name.split(':')
                .nth(3)
                .map(|classifier| !classifier.is_empty())
                .unwrap_or(false)
        })
        .unwrap_or(false)
}

fn maven_classifier_name(name: &str) -> Option<&str> {
    name.split(':').nth(3).filter(|c| !c.is_empty())
}

fn is_native_maven_classifier(name: &str) -> bool {
    maven_classifier_name(name)
        .map(|c| c.starts_with("natives-"))
        .unwrap_or(false)
}

/// MC 1.20+ ships one library entry per native classifier; pick the one for this CPU.
fn windows_native_classifier_matches(classifier: &str) -> bool {
    #[cfg(target_arch = "aarch64")]
    {
        return classifier == "natives-windows-arm64";
    }
    #[cfg(target_arch = "x86")]
    {
        return classifier == "natives-windows-x86";
    }
    #[cfg(not(any(target_arch = "aarch64", target_arch = "x86")))]
    {
        classifier == "natives-windows"
    }
}

fn should_collect_native_library(lib: &Value, os: &str) -> bool {
    let Some(name) = lib["name"].as_str() else {
        return false;
    };
    if !is_native_maven_classifier(name) {
        return false;
    }
    if os == "windows" {
        if let Some(classifier) = maven_classifier_name(name) {
            return windows_native_classifier_matches(classifier);
        }
        return false;
    }
    true
}

fn push_native_jar_from_lib(
    native_jars: &mut Vec<PathBuf>,
    game_dir: &Path,
    lib: &Value,
) -> Result<(), String> {
    if let Some(path) = library_jar_path(game_dir, lib)? {
        native_jars.push(path);
    }
    Ok(())
}

pub fn is_runtime_classpath_jar(path: &Path) -> bool {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if name.is_empty() {
        return false;
    }
    !name.contains("-natives-") && !name.ends_with("-natives.jar")
}

/// Windows canonicalize() adds a `\\?\` prefix that Java cannot load from classpath.
pub fn path_for_java(path: &Path) -> String {
    let raw = path.to_string_lossy();
    raw.strip_prefix(r"\\?\")
        .unwrap_or(&raw)
        .replace('/', std::path::MAIN_SEPARATOR_STR)
        .to_string()
}

pub fn classpath_for_java(classpath: &str) -> String {
    if classpath.is_empty() {
        return String::new();
    }
    classpath
        .split(';')
        .map(|entry| path_for_java_str(entry.trim()))
        .filter(|entry| !entry.is_empty())
        .collect::<Vec<_>>()
        .join(";")
}

pub fn path_for_java_str(path: &str) -> String {
    path.strip_prefix(r"\\?\")
        .unwrap_or(path)
        .replace('/', std::path::MAIN_SEPARATOR_STR)
        .to_string()
}

pub fn substitute_vars(template: &str, vars: &HashMap<&str, String>) -> String {
    let mut result = template.to_string();
    for (key, value) in vars {
        result = result.replace(&format!("${{{key}}}"), value);
    }
    result
}

pub fn build_classpath(entries: &[PathBuf]) -> String {
    dedupe_library_jars(entries.to_vec())
        .iter()
        .map(|p| path_for_java(p))
        .collect::<Vec<_>>()
        .join(";")
}

pub fn is_forge_bootstrap(version_json: &Value) -> bool {
    version_json
        .get("mainClass")
        .and_then(|v| v.as_str())
        .map(|c| c.contains("bootstraplauncher"))
        .unwrap_or(false)
}

/// Jars required by Forge/NeoForge BootstrapLauncher but omitted from version.json libraries.
pub fn forge_bootstrap_classpath_extras(
    game_dir: &Path,
    version_id: &str,
    mc_version: &str,
) -> Vec<PathBuf> {
    let libs = game_dir.join("libraries");
    let mut paths = Vec::new();

    let mut push = |path: PathBuf| {
        if path.exists() {
            paths.push(path);
        }
    };

    push(
        game_dir
            .join("versions")
            .join(mc_version)
            .join(format!("{mc_version}.jar")),
    );
    push(libs.join(
        "net/minecraftforge/mergetool/1.1.5/mergetool-1.1.5-api.jar",
    ));

    let is_neoforge = version_id.contains("-neoforge-");
    let loader_suffix = version_id
        .split("-neoforge-")
        .nth(1)
        .or_else(|| version_id.split("-forge-").nth(1));

    if let Some(fv) = loader_suffix {
        if is_neoforge {
            for subpath in [
                format!("net/neoforged/fmlcore/{fv}/fmlcore-{fv}.jar"),
                format!("net/neoforged/neoforge/{fv}/neoforge-{fv}.jar"),
                format!("net/neoforged/neoforge/{fv}/neoforge-{fv}-universal.jar"),
                format!("net/neoforged/neoforge/{fv}/neoforge-{fv}-client.jar"),
                format!("net/neoforged/javafmllanguage/{fv}/javafmllanguage-{fv}.jar"),
                format!("net/neoforged/lowcodelanguage/{fv}/lowcodelanguage-{fv}.jar"),
                format!("net/neoforged/mclanguage/{fv}/mclanguage-{fv}.jar"),
            ] {
                push(libs.join(subpath));
            }
        } else {
            for subpath in [
                format!("net/minecraftforge/fmlcore/{fv}/fmlcore-{fv}.jar"),
                format!("net/minecraftforge/forge/{fv}/forge-{fv}-universal.jar"),
                format!("net/minecraftforge/forge/{fv}/forge-{fv}-client.jar"),
                format!("net/minecraftforge/javafmllanguage/{fv}/javafmllanguage-{fv}.jar"),
                format!("net/minecraftforge/lowcodelanguage/{fv}/lowcodelanguage-{fv}.jar"),
                format!("net/minecraftforge/mclanguage/{fv}/mclanguage-{fv}.jar"),
            ] {
                push(libs.join(subpath));
            }
        }
    }

    let client_root = libs.join("net/minecraft/client");
    if client_root.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&client_root) {
            for entry in entries.flatten() {
                let dir = entry.path();
                if !dir.is_dir() {
                    continue;
                }
                let name = dir.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !name.starts_with(mc_version) {
                    continue;
                }
                if let Ok(files) = std::fs::read_dir(&dir) {
                    for file in files.flatten() {
                        let fname = file.file_name().to_string_lossy().to_string();
                        if fname.ends_with("-extra.jar") {
                            push(file.path());
                        }
                    }
                }
            }
        }
    }

    paths
}

/// Remove a vanilla client jar mistakenly written into a loader version folder.
pub fn cleanup_stale_loader_version_jar(
    game_dir: &Path,
    version_id: &str,
    mc_version: &str,
) {
    if !version_id.contains("-forge-") && !version_id.contains("-neoforge-") {
        return;
    }
    let wrong = game_dir
        .join("versions")
        .join(version_id)
        .join(format!("{version_id}.jar"));
    let vanilla = game_dir
        .join("versions")
        .join(mc_version)
        .join(format!("{mc_version}.jar"));
    if !wrong.exists() || !vanilla.exists() {
        return;
    }
    let Ok(wrong_meta) = std::fs::metadata(&wrong) else {
        return;
    };
    let Ok(vanilla_meta) = std::fs::metadata(&vanilla) else {
        return;
    };
    if wrong_meta.len() == vanilla_meta.len() {
        let _ = std::fs::remove_file(&wrong);
    }
}

fn maven_coordinate_key(name: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = name.split(':').collect();
    if parts.len() < 3 {
        return None;
    }
    Some((parts[0].to_string(), parts[1].to_string()))
}

fn library_artifact_key_from_path(path: &Path) -> Option<(String, String, String)> {
    let components: Vec<_> = path
        .components()
        .filter_map(|c| c.as_os_str().to_str())
        .collect();
    let lib_idx = components.iter().position(|c| *c == "libraries")?;
    let after = &components[lib_idx + 1..];
    if after.len() < 3 {
        return None;
    }
    let version = after[after.len() - 2].to_string();
    let artifact = after[after.len() - 3].to_string();
    let group = after[..after.len() - 3].join(".");
    Some((group, artifact, version))
}

fn compare_version_strings(a: &str, b: &str) -> std::cmp::Ordering {
    let pa: Vec<u32> = a
        .split(|c| c == '.' || c == '-' || c == '_' || c == '+')
        .filter_map(|s| s.parse().ok())
        .collect();
    let pb: Vec<u32> = b
        .split(|c| c == '.' || c == '-' || c == '_' || c == '+')
        .filter_map(|s| s.parse().ok())
        .collect();
    pa.cmp(&pb)
}

fn jar_classifier_label(path: &Path) -> String {
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");
    let Some((_group, artifact, version)) = library_artifact_key_from_path(path) else {
        return filename.to_string();
    };
    let prefix = format!("{artifact}-{version}");
    if !filename.starts_with(&prefix) {
        return String::new();
    }
    let rest = &filename[prefix.len()..];
    if rest == ".jar" {
        return String::new();
    }
    rest.strip_prefix('-')
        .and_then(|s| s.strip_suffix(".jar"))
        .unwrap_or("")
        .to_string()
}

pub fn dedupe_library_jars(entries: Vec<PathBuf>) -> Vec<PathBuf> {
    use std::collections::HashSet;

    let mut best: HashMap<(String, String, String), (String, PathBuf)> = HashMap::new();

    for path in &entries {
        if !path.exists() || !is_runtime_classpath_jar(path) {
            continue;
        }
        let normalized = normalize_library_path(path);

        let Some((group, artifact, version)) = library_artifact_key_from_path(&normalized) else {
            let key = (
                "__path__".into(),
                normalized.to_string_lossy().to_string(),
                String::new(),
            );
            best.entry(key).or_insert(("0".into(), normalized));
            continue;
        };

        let classifier = jar_classifier_label(&normalized);
        let key = (group, artifact, classifier);
        match best.get(&key) {
            Some((existing_version, _)) => {
                if compare_version_strings(&version, existing_version) == std::cmp::Ordering::Greater
                {
                    best.insert(key, (version, normalized));
                }
            }
            None => {
                best.insert(key, (version, normalized));
            }
        }
    }

    let mut seen = HashSet::new();
    let mut result = Vec::new();
    for path in entries {
        if !path.exists() || !is_runtime_classpath_jar(&path) {
            continue;
        }
        let normalized = normalize_library_path(&path);
        let key = if let Some((group, artifact, _version)) =
            library_artifact_key_from_path(&normalized)
        {
            (group, artifact, jar_classifier_label(&normalized))
        } else {
            (
                "__path__".into(),
                normalized.to_string_lossy().to_string(),
                String::new(),
            )
        };
        if !seen.insert(key.clone()) {
            continue;
        }
        if let Some((_, best_path)) = best.get(&key) {
            result.push(best_path.clone());
        }
    }
    result
}

pub fn process_arguments(
    args: Option<&Value>,
    vars: &HashMap<&str, String>,
    os: &str,
) -> Vec<String> {
    let mut result = Vec::new();
    let Some(arr) = args.and_then(|v| v.as_array()) else {
        return result;
    };

    for arg in arr {
        if let Some(s) = arg.as_str() {
            result.push(substitute_vars(s, vars));
            continue;
        }
        if let Some(obj) = arg.as_object() {
            if !rule_matches(obj.get("rules").map(|v| v), os) {
                continue;
            }
            match obj.get("value") {
                Some(Value::String(s)) => result.push(substitute_vars(s, vars)),
                Some(Value::Array(values)) => {
                    for v in values {
                        if let Some(s) = v.as_str() {
                            result.push(substitute_vars(s, vars));
                        }
                    }
                }
                _ => {}
            }
        }
    }
    result
}

pub fn legacy_arguments(version_json: &Value, vars: &HashMap<&str, String>) -> Vec<String> {
    version_json["minecraftArguments"]
        .as_str()
        .map(|s| {
            substitute_vars(s, vars)
                .split_whitespace()
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}
