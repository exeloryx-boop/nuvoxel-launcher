use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[tauri::command]
pub fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn install_launcher_update(download_url: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()
        .map_err(|e| format!("ERR_HTTP_CLIENT:{e}"))?;

    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("ERR_UPDATE_DOWNLOAD:{e}"))?;

    if !response.status().is_success() {
        return Err(format!("ERR_UPDATE_HTTP:{}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("ERR_UPDATE_BODY:{e}"))?;

    let temp_dir = std::env::temp_dir().join("nuvoxel-update");
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("ERR_UPDATE_DIR:{e}"))?;

    let filename = download_url
        .rsplit('/')
        .next()
        .filter(|s| !s.is_empty())
        .unwrap_or("Nuvoxel-Launcher-update.exe");

    let installer_path: PathBuf = temp_dir.join(filename);
    let mut file = std::fs::File::create(&installer_path)
        .map_err(|e| format!("ERR_UPDATE_FILE:{e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("ERR_UPDATE_WRITE:{e}"))?;
    drop(file);

    let mut cmd = Command::new(&installer_path);
    cmd.arg("/S");

    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.spawn()
        .map_err(|e| format!("ERR_UPDATE_SPAWN:{e}"))?;

    std::process::exit(0);
}
