use std::collections::HashMap;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::fs;
use zip::ZipArchive;

use crate::app_meta;

use super::download::{
    apply_skin, build_classpath, cleanup_stale_loader_version_jar, download_all_libraries,
    download_assets, download_client, ensure_custom_skin_loader, ensure_vanilla_base,
    extract_natives, forge_bootstrap_classpath_extras, is_forge_bootstrap, legacy_arguments,
    path_for_java, process_arguments, resolve_inherited_version, classpath_for_java, download_file,
};
use super::java::{find_java_for_version, find_or_install_java_for_version};
use super::mod_loaders::resolve_loader_version;
use super::offline::setup_offline_session;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchOptions {
    pub version: String,
    pub username: String,
    pub game_dir: String,
    pub memory_mb: u32,
    pub jvm_params: String,
    pub java_path: Option<String>,
    pub skin_username: Option<String>,
    pub skin_model: Option<String>,
    pub skin_cape_username: Option<String>,
    pub custom_skin_data: Option<String>,
    pub custom_cape_data: Option<String>,
    pub loader: String,
    pub integrity_check: bool,
    pub simultaneous_downloads: u8,
    pub server_address: Option<String>,
    pub server_port: Option<u16>,
    pub language: Option<String>,
    /// `microsoft` = licensed (real Mojang auth); `local` / `nuvoxel` = offline
    pub account_type: Option<String>,
    pub resolution: Option<String>,
    #[serde(default)]
    pub nuvoxel_client: bool,
    pub nuvoxel_client_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LaunchProgress {
    pub stage: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u32>,
    pub percent: Option<u8>,
}

fn emit(
    app: &AppHandle,
    stage: &str,
    n: Option<u32>,
    total: Option<u32>,
    percent: Option<u8>,
) {
    let _ = app.emit(
        "launch-progress",
        LaunchProgress {
            stage: stage.into(),
            n,
            total,
            percent,
        },
    );
}

pub async fn launch(app: &AppHandle, opts: LaunchOptions) -> Result<u32, String> {
    let loader = if opts.loader.is_empty() || opts.loader == "vanilla" {
        "vanilla"
    } else {
        &opts.loader
    };

    if loader != "vanilla" {
        emit(app, "loader", None, None, None);
    }

    // Nuvoxel is a managed client profile.  Give it an isolated game
    // directory so user-installed mods from the regular `.minecraft/mods`
    // folder can never make the selected Nuvoxel version incompatible.
    let game_dir = if opts.nuvoxel_client {
        PathBuf::from(&opts.game_dir)
            .join(".nuvoxel")
            .join(&opts.version)
    } else {
        PathBuf::from(&opts.game_dir)
    };
    fs::create_dir_all(&game_dir)
        .await
        .map_err(|e| e.to_string())?;

    let client = Client::builder()
        .user_agent(app_meta::user_agent())
        .build()
        .map_err(|e| e.to_string())?;

    emit(app, "manifest", None, None, None);

    let java = find_or_install_java_for_version(
        opts.java_path.as_deref(),
        &opts.version,
        &game_dir,
    )
    .await?;

    if loader == "forge" || loader == "neoforge" || loader == "optifine" {
        emit(app, "client", None, None, Some(3));
        ensure_vanilla_base(
            &client,
            &game_dir,
            &opts.version,
            opts.integrity_check,
        )
        .await?;
    }

    let (version_id, version_json) = resolve_loader_version(
        &client,
        &game_dir,
        &opts.version,
        loader,
        opts.java_path.as_deref(),
    )
    .await?;
    let version_json = resolve_inherited_version(&client, &game_dir, &version_json).await?;
    save_merged_version(&game_dir, &version_id, &version_json).await?;
    cleanup_stale_loader_version_jar(&game_dir, &version_id, &opts.version);

    if opts.nuvoxel_client {
        if loader != "fabric" && loader != "quilt" {
            return Err("ERR_NUVOXEL_REQUIRES_FABRIC".into());
        }
        ensure_nuvoxel_client(&client, &game_dir, &opts.version, opts.nuvoxel_client_url.as_deref()).await?;
    }

    emit(app, "client", None, None, Some(5));
    let client_jar = download_client(
        &client,
        &game_dir,
        &version_id,
        &version_json,
        opts.integrity_check,
    )
    .await?;

    let concurrency = opts.simultaneous_downloads as usize;
    emit(app, "libraries", None, None, Some(15));
    let libs = download_all_libraries(
        app,
        &client,
        &game_dir,
        &version_json,
        opts.integrity_check,
        concurrency,
    )
    .await?;

    emit(app, "natives", None, None, Some(40));
    let natives_dir = extract_natives(&game_dir, &version_id, &libs.native_jars).await?;

    emit(app, "assets", None, None, Some(50));
    download_assets(
        app,
        &client,
        &game_dir,
        &version_json,
        opts.integrity_check,
        concurrency,
    )
    .await?;

    emit(app, "skin", None, None, Some(90));
    if matches!(loader, "fabric" | "quilt" | "forge" | "neoforge") {
        if let Err(e) = ensure_custom_skin_loader(&client, &game_dir, &opts.version, loader).await {
            eprintln!("CustomSkinLoader skipped: {e}");
        }
    }
    let effective_skin_user = opts.skin_username.as_deref().unwrap_or(&opts.username);
    apply_skin(
        &client,
        &game_dir,
        &opts.username,
        Some(effective_skin_user),
        opts.skin_model.as_deref(),
        opts.skin_cape_username.as_deref(),
        opts.custom_skin_data.as_deref(),
        opts.custom_cape_data.as_deref(),
    )
    .await
    .unwrap_or_else(|e| {
        eprintln!("Skin apply skipped: {e}");
    });

    emit(app, "session", None, None, Some(88));
    let (uuid_str, access_token) =
        setup_offline_session(&game_dir, &opts.username, opts.language.as_deref()).await?;

    emit(app, "starting", None, None, Some(95));

    let pid = spawn_process(
        app,
        &java,
        &opts,
        &game_dir,
        &version_id,
        &version_json,
        client_jar.as_deref(),
        &libs.classpath,
        &natives_dir,
        &uuid_str,
        &access_token,
    )?;

    emit(app, "done", None, None, Some(100));
    Ok(pid)
}

/// Installs the launcher-owned module into the selected profile, without
/// touching the user's other Minecraft installations.
async fn ensure_nuvoxel_client(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    url: Option<&str>,
) -> Result<(), String> {
    let mods_dir = game_dir.join("mods");
    fs::create_dir_all(&mods_dir).await.map_err(|e| e.to_string())?;
    let filename = format!("nuvoxel-client-{mc_version}.jar");
    let module_path = mods_dir.join(filename);

    let mut download_err = None;
    if let Some(u) = url {
        if u.starts_with("https://") || u.starts_with("http://127.0.0.1:") || u.starts_with("http://localhost:") {
            if let Err(e) = download_file(client, u, &module_path, None, true).await {
                download_err = Some(e);
            }
        }
    }

    if validate_nuvoxel_client_jar(&module_path).is_err() {
        let local_candidates = [
            PathBuf::from("nuvoxel-client.jar"),
            PathBuf::from("api/client-mods/nuvoxel-client.jar"),
            PathBuf::from("nuvoxel-client/build/libs/nuvoxel-client-0.2.0-beta.jar"),
        ];
        let mut copied = false;
        for candidate in &local_candidates {
            if candidate.exists() && validate_nuvoxel_client_jar(candidate).is_ok() {
                if fs::copy(candidate, &module_path).await.is_ok() {
                    copied = true;
                    break;
                }
            }
        }
        if !copied {
            if let Some(e) = download_err {
                return Err(format!("ERR_NUVOXEL_CLIENT_DOWNLOAD:{e}"));
            }
            return Err("ERR_NUVOXEL_CLIENT_UNAVAILABLE".into());
        }
    }
    validate_nuvoxel_client_jar(&module_path)
}

/// Reject an incorrectly built Nuvoxel module before Fabric starts. Java ZIP
/// class entries must use forward slashes, otherwise Fabric can read metadata
/// but cannot load the declared entrypoint.
fn validate_nuvoxel_client_jar(path: &Path) -> Result<(), String> {
    let file = File::open(path).map_err(|e| format!("ERR_NUVOXEL_CLIENT_INVALID:{e}"))?;
    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("ERR_NUVOXEL_CLIENT_INVALID:{e}"))?;

    archive
        .by_name("fabric.mod.json")
        .map_err(|_| "ERR_NUVOXEL_CLIENT_INVALID:missing fabric.mod.json".to_string())?;
    archive
        .by_name("net/nuvoxel/client/NuvoxelClient.class")
        .map_err(|_| {
            "ERR_NUVOXEL_CLIENT_INVALID:missing net/nuvoxel/client/NuvoxelClient.class".to_string()
        })?;
    Ok(())
}

async fn save_merged_version(
    game_dir: &Path,
    version_id: &str,
    version_json: &serde_json::Value,
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

fn spawn_process(
    app: &AppHandle,
    java: &Path,
    opts: &LaunchOptions,
    game_dir: &Path,
    version_id: &str,
    version_json: &serde_json::Value,
    client_jar: Option<&Path>,
    library_jars: &[PathBuf],
    natives_dir: &Path,
    uuid_str: &str,
    access_token: &str,
) -> Result<u32, String> {
    let asset_index_id = version_json["assetIndex"]["id"]
        .as_str()
        .unwrap_or("legacy");

    let mut vars: HashMap<&str, String> = HashMap::new();
    vars.insert("auth_player_name", opts.username.clone());
    vars.insert("version_name", version_id.to_string());
    vars.insert("game_directory", game_dir.to_string_lossy().to_string());
    vars.insert(
        "assets_root",
        game_dir.join("assets").to_string_lossy().to_string(),
    );
    vars.insert("assets_index_name", asset_index_id.to_string());
    vars.insert("auth_uuid", uuid_str.to_string());
    vars.insert("auth_access_token", access_token.to_string());
    vars.insert("user_type", "legacy".into());
    vars.insert(
        "user_properties",
        "{}".into(),
    );
    vars.insert(
        "version_type",
        version_json["type"].as_str().unwrap_or("release").into(),
    );
    vars.insert(
        "natives_directory",
        natives_dir.to_string_lossy().to_string(),
    );
    vars.insert("launcher_name", "NuvolexLauncher".into());
    vars.insert("launcher_version", app_meta::version().into());
    let (res_w, res_h) = match opts.resolution.as_deref() {
        Some("fullscreen") | Some("maximized") => ("1920", "1080"),
        _ => ("1280", "720"),
    };
    vars.insert("resolution_width", res_w.into());
    vars.insert("resolution_height", res_h.into());
    let bootstrap = is_forge_bootstrap(version_json);
    let mut classpath_entries: Vec<PathBuf> = if bootstrap {
        forge_bootstrap_classpath_extras(game_dir, version_id, &opts.version)
    } else {
        Vec::new()
    };
    classpath_entries.extend(
        library_jars
            .iter()
            .filter(|p| p.exists())
            .cloned(),
    );
    if !bootstrap {
        if let Some(jar) = client_jar {
            if jar.exists() {
                classpath_entries.push(jar.to_path_buf());
            }
        }
    }
    let classpath = build_classpath(&classpath_entries);
    vars.insert("classpath", classpath.clone());
    let library_dir = game_dir.join("libraries");
    vars.insert(
        "library_directory",
        path_for_java(&library_dir),
    );
    vars.insert("classpath_separator", ";".into());

    let main_class = version_json["mainClass"]
        .as_str()
        .ok_or("ERR_MAIN_CLASS")?;

    let xms_mb = if opts.memory_mb <= 2048 {
        (opts.memory_mb / 2).max(256)
    } else {
        (opts.memory_mb / 4).max(512)
    };
    let mut jvm_args = vec![
        format!("-Xmx{}M", opts.memory_mb),
        format!("-Xms{}M", xms_mb),
        format!("-Dminecraft.launcher.brand=NuvolexLauncher"),
        format!("-Dminecraft.launcher.version={}", app_meta::version()),
    ];

    // Offline accounts: redirect Mojang API so Multiplayer stays enabled (all versions).
    if should_use_offline_multiplayer_fixup(opts) {
        jvm_args.extend(offline_multiplayer_jvm_args());
    }

    if version_json.get("arguments").is_some() {
        jvm_args.extend(process_arguments(
            version_json["arguments"].get("jvm"),
            &vars,
            "windows",
        ));
    } else {
        jvm_args.push(format!("-Djava.library.path={}", natives_dir.display()));
        jvm_args.push("-cp".into());
        jvm_args.push(classpath.clone());
    }

    normalize_jvm_args(&mut jvm_args, &classpath, natives_dir);

    if bootstrap {
        // Forge early GL window can crash on some GPUs/drivers (font/module path race).
        jvm_args.push("-Dfml.earlyprogresswindow=false".into());
        ensure_bootstrap_legacy_classpath(&mut jvm_args, &classpath);
    }

    if jvm_args.iter().any(|a| a.contains("${")) {
        return Err("ERR_JVM_UNRESOLVED_VARS".into());
    }

    if !opts.jvm_params.trim().is_empty() {
        jvm_args.extend(
            opts.jvm_params
                .split_whitespace()
                .map(str::to_string),
        );
    }

    let game_args = if version_json.get("arguments").is_some() {
        process_arguments(
            version_json["arguments"].get("game"),
            &vars,
            "windows",
        )
    } else {
        legacy_arguments(version_json, &vars)
    };

    let mut final_game_args = game_args;

    let has_demo = final_game_args
        .iter()
        .any(|a| a == "--demo" || a == "-demo");
    if has_demo {
        final_game_args.retain(|a| a != "--demo" && a != "-demo");
    }

    if should_use_offline_multiplayer_fixup(opts) {
        final_game_args.retain(|a| a != "--disableMultiplayer" && a != "--disableChat");
    }

    // Strip broken template quickPlay flags before adding our server connect args.
    sanitize_game_arguments(&mut final_game_args);

    if let Some(host) = &opts.server_address {
        let port = opts.server_port.unwrap_or(25565);
        append_server_connect_args(&mut final_game_args, host, port, &opts.version);
    }

    if opts.resolution.as_deref() == Some("fullscreen") {
        final_game_args.push("--fullscreen".into());
    }

    let log_path = game_dir.join("logs").join("nuvolexlauncher-latest.log");
    let log_file = std::fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&log_path)
        .map_err(|_e| format!("ERR_LOG_CREATE:{}", log_path.display()))?;

    // Windows cmd line limit ~8191 chars — Fabric classpath often exceeds it.
    // Java 9+ @argfile supports unlimited classpath length.
    let arg_file = write_launch_arg_file(game_dir, &jvm_args, main_class, &final_game_args)?;
    let arg_prefix = format!("@{}", arg_file.to_string_lossy());

    let mut cmd = Command::new(java);
    cmd.arg(&arg_prefix)
        .current_dir(game_dir)
        .stdout(Stdio::from(log_file.try_clone().map_err(|e| e.to_string())?))
        .stderr(Stdio::from(log_file));

    // Hide java.exe console window on Windows (logs go to nuvoxel-latest.log).
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd.spawn().map_err(|_| {
        format!(
            "ERR_JAVA_SPAWN:{}|{}",
            java.display(),
            opts.version
        )
    })?;

    for _ in 0..20 {
        std::thread::sleep(Duration::from_millis(500));
        if let Ok(Some(status)) = child.try_wait() {
            return Err(format!(
                "ERR_EXIT_EARLY:{}|{}",
                status,
                log_path.display()
            ));
        }
        if log_shows_crash(&log_path) {
            let _ = child.kill();
            return Err(format!(
                "ERR_EXIT_EARLY:exit code: 1|{}",
                log_path.display()
            ));
        }
    }

    let pid = child.id();
    let app_handle = app.clone();
    std::thread::spawn(move || {
        let _ = child.wait();
        let _ = app_handle.emit("game-exited", ());
    });

    Ok(pid)
}

fn log_shows_crash(log_path: &Path) -> bool {
    let Ok(content) = std::fs::read_to_string(log_path) else {
        return false;
    };
    const FATAL: &[&str] = &[
        "Minecraft has crashed!",
        "Could not launch Minecraft",
        "Failed to launch",
        "Encountered serious error loading launch plugin",
        "Missing legacyClassPath",
        "There was a severe problem during mod loading",
        "ClassNotFoundException: net.minecraftforge.api.distmarker.OnlyIn",
        "ClassNotFoundException: cpw.mods.bootstraplauncher",
        "Process crashed with exit code",
    ];
    FATAL.iter().any(|needle| content.contains(needle))
}

fn ensure_bootstrap_legacy_classpath(jvm_args: &mut Vec<String>, classpath: &str) {
    let leg = format!("-DlegacyClassPath={}", classpath_for_java(classpath));
    if let Some(idx) = jvm_args
        .iter()
        .position(|a| a.starts_with("-DlegacyClassPath="))
    {
        jvm_args[idx] = leg;
        return;
    }
    if let Some(p_idx) = jvm_args.iter().position(|a| a == "-p") {
        jvm_args.insert(p_idx, leg);
    } else {
        jvm_args.push(leg);
    }
}

fn normalize_jvm_args(jvm_args: &mut Vec<String>, classpath: &str, natives_dir: &Path) {
    // Mojang shipped this legacy option in the 26.2 manifest, but current
    // Java runtimes reject it before Minecraft even starts.  Filtering it at
    // launch time also repairs already-cached version manifests.
    jvm_args.retain(|arg| !arg.starts_with("--sun-misc-unsafe-memory-access"));

    let is_module_launch = jvm_args.iter().any(|a| a == "-p");
    let natives = path_for_java(natives_dir);

    for arg in jvm_args.iter_mut() {
        if arg.starts_with("-Djava.library.path=") {
            *arg = format!("-Djava.library.path={natives}");
        } else if arg.starts_with("-Djna.tmpdir=") {
            *arg = format!("-Djna.tmpdir={natives}");
        } else if arg.starts_with("-Dorg.lwjgl.system.SharedLibraryExtractPath=") {
            *arg = format!("-Dorg.lwjgl.system.SharedLibraryExtractPath={natives}");
        } else if arg.starts_with("-Dio.netty.native.workdir=") {
            *arg = format!("-Dio.netty.native.workdir={natives}");
        }
    }

    if is_module_launch {
        return;
    }

    let mut i = 0;
    while i < jvm_args.len() {
        if jvm_args[i] == "-cp" {
            jvm_args.remove(i);
            if i < jvm_args.len() {
                jvm_args.remove(i);
            }
            continue;
        }
        i += 1;
    }

    for prefix in [
        "-Djava.library.path=",
        "-Djna.tmpdir=",
        "-Dorg.lwjgl.system.SharedLibraryExtractPath=",
        "-Dio.netty.native.workdir=",
    ] {
        jvm_args.retain(|a| !a.starts_with(prefix));
    }
    jvm_args.push(format!("-Djava.library.path={natives}"));
    jvm_args.push(format!("-Djna.tmpdir={natives}"));
    jvm_args.push(format!(
        "-Dorg.lwjgl.system.SharedLibraryExtractPath={natives}"
    ));
    jvm_args.push(format!("-Dio.netty.native.workdir={natives}"));
    jvm_args.push("-cp".into());
    jvm_args.push(classpath_for_java(classpath));
}

fn format_arg_file_line(arg: &str) -> String {
    if arg.contains(' ') || arg.contains('\t') {
        format!("\"{}\"", arg.replace('"', "\\\""))
    } else {
        arg.to_string()
    }
}

fn write_launch_arg_file(
    game_dir: &Path,
    jvm_args: &[String],
    main_class: &str,
    game_args: &[String],
) -> Result<PathBuf, String> {
    let arg_dir = game_dir.join(".nuvolexlauncher");
    std::fs::create_dir_all(&arg_dir).map_err(|e| e.to_string())?;
    let arg_file = arg_dir.join("launch.jvm.args");

    let mut lines: Vec<String> = jvm_args.iter().map(|a| format_arg_file_line(a)).collect();
    lines.push(format_arg_file_line(main_class));
    lines.extend(game_args.iter().map(|a| format_arg_file_line(a)));

    std::fs::write(&arg_file, lines.join("\n")).map_err(|e| e.to_string())?;
    Ok(arg_file)
}

fn should_use_offline_multiplayer_fixup(opts: &LaunchOptions) -> bool {
    opts.account_type.as_deref() != Some("microsoft")
}

fn parse_mc_version_parts(version: &str) -> Option<(u32, u32)> {
    let base = version.split('-').next().unwrap_or(version);
    let mut parts = base.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    Some((major, minor))
}

fn version_supports_quick_play(version: &str) -> bool {
    parse_mc_version_parts(version)
        .map(|(major, minor)| major > 1 || (major == 1 && minor >= 20))
        .unwrap_or(false)
}

fn append_server_connect_args(args: &mut Vec<String>, host: &str, port: u16, mc_version: &str) {
    if version_supports_quick_play(mc_version) {
        args.push("--quickPlayMultiplayer".into());
        args.push(format!("{host}:{port}"));
        return;
    }
    args.push("--server".into());
    args.push(host.to_string());
    args.push("--port".into());
    args.push(port.to_string());
}

/// Strip unresolved Mojang template placeholders and orphan option flags.
/// MC 1.20+ adds `--quickPlay*` args with `${quickPlay*}` values; when those
/// vars are absent the value is removed but the flag remains and the game crashes.
fn sanitize_game_arguments(args: &mut Vec<String>) {
    args.retain(|a| !a.is_empty() && !a.contains("${"));

    let mut cleaned = Vec::with_capacity(args.len());
    let mut i = 0;
    while i < args.len() {
        let arg = args[i].as_str();
        if arg.starts_with("--quickPlay") {
            i += 1;
            if i < args.len() && !args[i].starts_with('-') {
                i += 1;
            }
            continue;
        }
        cleaned.push(args[i].clone());
        i += 1;
    }
    *args = cleaned;

    i = 0;
    while i < args.len() {
        if game_option_requires_value(&args[i])
            && (i + 1 >= args.len() || args[i + 1].starts_with('-'))
        {
            args.remove(i);
            continue;
        }
        i += 1;
    }
}

fn game_option_requires_value(arg: &str) -> bool {
    matches!(
        arg,
        "--world" | "--server" | "--port" | "--username" | "--uuid" | "--accessToken"
            | "--quickPlaySingleplayer" | "--quickPlayMultiplayer" | "--quickPlayRealms"
    ) || arg.starts_with("--quickPlay")
}

fn offline_multiplayer_jvm_args() -> Vec<String> {
    vec![
        "-Dminecraft.api.env=custom".into(),
        "-Dminecraft.api.auth.host=https://invalid.invalid".into(),
        "-Dminecraft.api.account.host=https://invalid.invalid".into(),
        "-Dminecraft.api.session.host=https://invalid.invalid".into(),
        "-Dminecraft.api.services.host=https://invalid.invalid".into(),
    ]
}

#[tauri::command]
pub async fn launch_minecraft(
    app: AppHandle,
    options: LaunchOptions,
) -> Result<u32, String> {
    launch(&app, options).await
}

#[tauri::command]
pub async fn detect_java(
    java_path: Option<String>,
    mc_version: Option<String>,
) -> Result<String, String> {
    let version = mc_version.unwrap_or_else(|| "1.21.4".into());
    let path = find_java_for_version(
        java_path.as_deref().filter(|s| !s.trim().is_empty()),
        &version,
    )?;
    Ok(path.to_string_lossy().to_string())
}
