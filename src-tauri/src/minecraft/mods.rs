use std::path::{Path, PathBuf};

use reqwest::Client;
use serde::Serialize;
use tauri_plugin_opener::OpenerExt;

use crate::app_meta;

use super::download::download_file;

fn is_jar(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("jar"))
}

fn is_zip(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("zip"))
}

async fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    tokio::fs::create_dir_all(dst)
        .await
        .map_err(|e| e.to_string())?;

    let mut entries = tokio::fs::read_dir(src)
        .await
        .map_err(|e| e.to_string())?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        let file_type = entry
            .file_type()
            .await
            .map_err(|e| e.to_string())?;

        if file_type.is_dir() {
            Box::pin(copy_dir_recursive(&src_path, &dst_path)).await?;
        } else {
            tokio::fs::copy(&src_path, &dst_path)
                .await
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn open_folder(app: tauri::AppHandle, folder_path: String) -> Result<(), String> {
    let path = PathBuf::from(&folder_path);
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| e.to_string())?;

    let open_path = path
        .canonicalize()
        .unwrap_or(path)
        .to_string_lossy()
        .into_owned();

    app.opener()
        .open_path(open_path, None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_mod_file(url: String, dest_path: String) -> Result<String, String> {    let client = Client::builder()
        .user_agent(app_meta::user_agent())
        .build()
        .map_err(|e| e.to_string())?;

    let path = PathBuf::from(&dest_path);
    download_file(&client, &url, &path, None, false).await?;
    Ok(dest_path)
}

#[tauri::command]
pub async fn delete_mod_file(path: String) -> Result<(), String> {
    let p = PathBuf::from(path);
    if p.exists() {
        tokio::fs::remove_file(p)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn copy_mod_file(source_path: String, dest_path: String) -> Result<String, String> {
    let src = PathBuf::from(&source_path);
    if !src.is_file() {
        return Err("ERR_NOT_FILE".into());
    }
    if !is_jar(&src) {
        return Err("ERR_NOT_JAR".into());
    }

    let dest = PathBuf::from(&dest_path);
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }
    tokio::fs::copy(&src, &dest)
        .await
        .map_err(|e| e.to_string())?;
    Ok(dest_path)
}

#[tauri::command]
pub async fn delete_pack_folder(folder_path: String) -> Result<(), String> {
    let path = PathBuf::from(folder_path);
    if path.exists() {
        tokio::fs::remove_dir_all(path)
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_mod_files(folder_path: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(&folder_path);
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    let mut entries = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| e.to_string())?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        let entry_path = entry.path();
        if entry_path.is_file() && is_jar(&entry_path) {
            files.push(entry_path.to_string_lossy().into_owned());
        }
    }

    files.sort();
    Ok(files)
}

#[tauri::command]
pub async fn copy_pack_file(source_path: String, dest_path: String) -> Result<String, String> {
    let src = PathBuf::from(&source_path);
    if !src.is_file() {
        return Err("ERR_NOT_FILE".into());
    }

    let dest = PathBuf::from(&dest_path);
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }
    tokio::fs::copy(&src, &dest)
        .await
        .map_err(|e| e.to_string())?;
    Ok(dest_path)
}

#[tauri::command]
pub async fn copy_pack_folder(source_path: String, dest_path: String) -> Result<String, String> {
    let src = PathBuf::from(&source_path);
    if !src.is_dir() {
        return Err("ERR_NOT_DIR".into());
    }

    let dest = PathBuf::from(&dest_path);
    if dest.exists() {
        return Err("ERR_DEST_EXISTS".into());
    }

    copy_dir_recursive(&src, &dest).await?;
    Ok(dest_path)
}

#[tauri::command]
pub async fn path_is_directory(path: String) -> Result<bool, String> {
    Ok(PathBuf::from(path).is_dir())
}

#[derive(Serialize)]
pub struct PackAssetListing {
    pub path: String,
    pub is_directory: bool,
}

#[tauri::command]
pub async fn list_pack_assets(folder_path: String) -> Result<Vec<PackAssetListing>, String> {
    let path = PathBuf::from(&folder_path);
    tokio::fs::create_dir_all(&path)
        .await
        .map_err(|e| e.to_string())?;

    let mut assets = Vec::new();
    let mut entries = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| e.to_string())?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        let entry_path = entry.path();
        let file_type = entry
            .file_type()
            .await
            .map_err(|e| e.to_string())?;

        if file_type.is_dir() {
            assets.push(PackAssetListing {
                path: entry_path.to_string_lossy().into_owned(),
                is_directory: true,
            });
        } else if entry_path.is_file() && is_zip(&entry_path) {
            assets.push(PackAssetListing {
                path: entry_path.to_string_lossy().into_owned(),
                is_directory: false,
            });
        }
    }

    assets.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(assets)
}
