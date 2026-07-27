use std::io::Read;
use std::path::Path;
use std::process::Command;

use reqwest::Client;
use serde_json::{json, Value};
use tokio::fs;

use super::download::download_file;
use super::java::resolve_java_executable;

pub async fn ensure_forge_installed(
    java: &Path,
    client: &Client,
    game_dir: &Path,
    _mc_version: &str,
    installer_url: &str,
) -> Result<(String, Value), String> {
    let cache_dir = game_dir.join(".nuvolexlauncher").join("installers");
    fs::create_dir_all(&cache_dir)
        .await
        .map_err(|e| e.to_string())?;

    let installer_name = installer_url
        .rsplit('/')
        .next()
        .unwrap_or("forge-installer.jar");
    let installer_path = cache_dir.join(installer_name);

    if !installer_path.exists() {
        download_file(client, installer_url, &installer_path, None, false).await?;
    }

    let preview = read_json_from_installer(&installer_path, "version.json")?;
    let version_id = preview["id"]
        .as_str()
        .ok_or("ERR_FORGE_PROFILE_ID")?
        .to_string();

    let installed_json = game_dir
        .join("versions")
        .join(&version_id)
        .join(format!("{version_id}.json"));

    if !installed_json.exists() {
        ensure_launcher_profiles(game_dir).await?;
        run_installer(java, &installer_path, game_dir)?;
        if !installed_json.exists() {
            return Err(format!(
                "ERR_FORGE_INSTALL_FAILED:{}",
                installed_json.display()
            ));
        }
    }

    let raw = fs::read_to_string(&installed_json)
        .await
        .map_err(|e| e.to_string())?;
    let version_json: Value =
        serde_json::from_str(&raw).map_err(|e| format!("ERR_FORGE_JSON:{e}"))?;
    Ok((version_id, version_json))
}

fn run_installer(
    java: &Path,
    installer_jar: &Path,
    game_dir: &Path,
) -> Result<(), String> {
    let java = resolve_java_executable(java);
    let game_dir_str = game_dir.to_string_lossy();
    let mut cmd = Command::new(&java);
    cmd.arg("-jar")
        .arg(installer_jar)
        .arg("--installClient")
        .arg(game_dir.as_os_str())
        .current_dir(game_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("ERR_FORGE_INSTALL_SPAWN:{e}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    Err(format!(
        "ERR_FORGE_INSTALL:{game_dir_str}|{stderr}{stdout}"
    ))
}

async fn ensure_launcher_profiles(game_dir: &Path) -> Result<(), String> {
    let profile_path = game_dir.join("launcher_profiles.json");
    if profile_path.exists() {
        return Ok(());
    }

    fs::create_dir_all(game_dir)
        .await
        .map_err(|e| e.to_string())?;

    let minimal = json!({
        "profiles": {},
        "selectedProfile": null,
        "clientToken": "null",
        "authenticationDatabase": {},
        "settings": {
            "enableAdvanced": false
        }
    });

    fs::write(
        &profile_path,
        serde_json::to_string_pretty(&minimal).map_err(|e| e.to_string())?,
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn read_json_from_installer(installer_jar: &Path, entry_name: &str) -> Result<Value, String> {
    let bytes = std::fs::read(installer_jar).map_err(|e| format!("ERR_INSTALLER_READ:{e}"))?;
    let cursor = std::io::Cursor::new(bytes);
    let mut archive =
        zip::ZipArchive::new(cursor).map_err(|e| format!("ERR_INSTALLER_ZIP:{e}"))?;
    let mut entry = archive
        .by_name(entry_name)
        .map_err(|_| format!("ERR_INSTALLER_ENTRY:{entry_name}"))?;
    let mut content = String::new();
    entry
        .read_to_string(&mut content)
        .map_err(|e| format!("ERR_INSTALLER_PARSE:{e}"))?;
    serde_json::from_str(&content).map_err(|e| format!("ERR_INSTALLER_JSON:{e}"))
}
