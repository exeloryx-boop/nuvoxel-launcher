use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use reqwest::Client;
use serde::Serialize;
use zip::ZipArchive;

use super::download::download_file;

use crate::app_meta;
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModpackInstallResult {
    pub minecraft_version: String,
    pub loader: String,
    pub mod_count: u32,
    pub mod_filenames: Vec<String>,
}

#[derive(Debug, serde::Deserialize)]
struct ModpackIndex {
    #[serde(alias = "formatVersion")]
    #[allow(dead_code)]
    format_version: Option<u32>,
    #[serde(alias = "versionId")]
    version_id: Option<String>,
    dependencies: Option<serde_json::Map<String, serde_json::Value>>,
    files: Vec<ModpackFileEntry>,
}

#[derive(Debug, serde::Deserialize)]
struct ModpackFileEntry {
    path: String,
    downloads: Option<Vec<String>>,
    env: Option<ModpackEnv>,
}

#[derive(Debug, serde::Deserialize)]
struct ModpackEnv {
    client: Option<String>,
}

fn client_env_ok(env: &Option<ModpackEnv>) -> bool {
    match env.as_ref().and_then(|e| e.client.as_deref()) {
        None | Some("required") | Some("optional") => true,
        Some("unsupported") => false,
        Some(_) => true,
    }
}

fn map_loader(deps: &serde_json::Map<String, serde_json::Value>) -> String {
    for (key, value) in deps {
        let key_l = key.to_lowercase();
        let ver = value.as_str().unwrap_or("");
        if ver.is_empty() {
            continue;
        }
        if key_l.contains("fabric-loader") || key_l == "fabric" {
            return "fabric".into();
        }
        if key_l.contains("quilt-loader") || key_l == "quilt" {
            return "quilt".into();
        }
        if key_l.contains("neoforge") || key_l.contains("neo-forge") {
            return "neoforge".into();
        }
        if key_l.contains("forge") {
            return "forge".into();
        }
    }
    "fabric".into()
}

fn minecraft_version_from_index(index: &ModpackIndex) -> String {
    if let Some(deps) = &index.dependencies {
        if let Some(mc) = deps.get("minecraft").and_then(|v| v.as_str()) {
            if !mc.is_empty() {
                return mc.to_string();
            }
        }
    }
    index
        .version_id
        .clone()
        .unwrap_or_else(|| "1.21.4".into())
}

async fn download_bytes(client: &Client, url: &str) -> Result<Vec<u8>, String> {
    let res = client
        .get(url)
        .header("User-Agent", app_meta::user_agent())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("ERR_MODPACK_DOWNLOAD:{}", res.status()));
    }
    res.bytes()
        .await
        .map(|b| b.to_vec())
        .map_err(|e| e.to_string())
}

fn write_bytes(path: &Path, data: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut file = std::fs::File::create(path).map_err(|e| e.to_string())?;
    file.write_all(data).map_err(|e| e.to_string())?;
    Ok(())
}

fn zip_contains(archive: &mut ZipArchive<std::io::Cursor<Vec<u8>>>, path: &str) -> bool {
    let normalized = path.replace('\\', "/");
    archive.by_name(&normalized).is_ok()
}

fn read_zip_entry(archive: &mut ZipArchive<std::io::Cursor<Vec<u8>>>, path: &str) -> Option<Vec<u8>> {
    let normalized = path.replace('\\', "/");
    let mut file = archive.by_name(&normalized).ok()?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).ok()?;
    Some(buf)
}

#[tauri::command]
pub async fn install_modrinth_modpack(
    mrpack_url: String,
    pack_dir: String,
) -> Result<ModpackInstallResult, String> {
    let client = Client::builder()
        .user_agent(app_meta::user_agent())
        .build()
        .map_err(|e| e.to_string())?;

    let pack_root = PathBuf::from(&pack_dir);
    tokio::fs::create_dir_all(&pack_root)
        .await
        .map_err(|e| e.to_string())?;

    let bytes = download_bytes(&client, &mrpack_url).await?;
    let cursor = std::io::Cursor::new(bytes.clone());
    let mut archive = ZipArchive::new(cursor).map_err(|e| format!("ERR_MODPACK_ZIP:{}", e))?;

    let index_bytes = read_zip_entry(&mut archive, "modrinth.index.json")
        .ok_or_else(|| "ERR_MODPACK_INDEX".to_string())?;

    let index: ModpackIndex =
        serde_json::from_slice(&index_bytes).map_err(|e| format!("ERR_MODPACK_INDEX_PARSE:{}", e))?;

    let minecraft_version = minecraft_version_from_index(&index);
    let loader = index
        .dependencies
        .as_ref()
        .map(map_loader)
        .unwrap_or_else(|| "fabric".into());

    let mut mod_filenames = Vec::new();
    let mut archive2 = ZipArchive::new(std::io::Cursor::new(bytes))
        .map_err(|e| format!("ERR_MODPACK_ZIP:{}", e))?;

    for entry in &index.files {
        if !client_env_ok(&entry.env) {
            continue;
        }

        let rel = entry.path.replace('\\', "/");
        let dest = pack_root.join(&rel);

        if zip_contains(&mut archive2, &rel) {
            if let Some(data) = read_zip_entry(&mut archive2, &rel) {
                write_bytes(&dest, &data)?;
            }
        } else if let Some(url) = entry.downloads.as_ref().and_then(|d| d.first()) {
            if let Some(parent) = dest.parent() {
                tokio::fs::create_dir_all(parent)
                    .await
                    .map_err(|e| e.to_string())?;
            }
            download_file(&client, url, &dest, None, false).await?;
        } else {
            continue;
        }

        if rel.starts_with("mods/") && rel.ends_with(".jar") {
            if let Some(name) = dest.file_name().and_then(|n| n.to_str()) {
                mod_filenames.push(name.to_string());
            }
        }
    }

    mod_filenames.sort();
    mod_filenames.dedup();

    Ok(ModpackInstallResult {
        minecraft_version,
        loader,
        mod_count: mod_filenames.len() as u32,
        mod_filenames,
    })
}
