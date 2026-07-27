use std::path::Path;

use reqwest::Client;
use serde_json::{json, Value};
use tokio::fs;

use super::download::{fetch_json, fetch_version_url, save_version_json};
use super::forge_install::ensure_forge_installed;
use super::java::find_java_for_version;

const FORGE_PROMOTIONS: &str =
    "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json";
const NEOFORGE_VERSIONS: &str =
    "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge";

pub async fn resolve_loader_version(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    loader: &str,
    java_path: Option<&str>,
) -> Result<(String, Value), String> {
    match loader {
        "vanilla" => resolve_vanilla(client, game_dir, mc_version).await,
        "fabric" => resolve_fabric(client, game_dir, mc_version).await,
        "quilt" => resolve_quilt(client, game_dir, mc_version).await,
        "forge" | "optifine" => {
            resolve_forge(client, game_dir, mc_version, java_path).await
        }
        "neoforge" => resolve_neoforge(client, game_dir, mc_version, java_path).await,
        other => Err(format!("ERR_UNKNOWN_LOADER:{other}")),
    }
}

async fn resolve_vanilla(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
) -> Result<(String, Value), String> {
    let url = fetch_version_url(client, mc_version).await?;
    let json = fetch_json(client, &url).await?;
    save_version_json(game_dir, mc_version, &json).await?;
    Ok((mc_version.to_string(), json))
}

async fn resolve_fabric(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
) -> Result<(String, Value), String> {
    if let Some(found) = find_installed_loader_version(game_dir, mc_version, "fabric").await? {
        return Ok(found);
    }

    let loaders_url = format!("https://meta.fabricmc.net/v2/versions/loader/{mc_version}");
    let loaders_val = fetch_json(client, &loaders_url).await?;
    let loaders = loaders_val
        .as_array()
        .ok_or_else(|| format!("ERR_FABRIC_NO_LOADER:{mc_version}"))?;
    let loader_version = loaders
        .iter()
        .find(|l| l["loader"]["stable"].as_bool() == Some(true))
        .or_else(|| loaders.first())
        .and_then(|l| l["loader"]["version"].as_str())
        .ok_or_else(|| format!("ERR_FABRIC_NO_LOADER:{mc_version}"))?;

    let profile_url = format!(
        "https://meta.fabricmc.net/v2/versions/loader/{mc_version}/{loader_version}/profile/json"
    );
    let profile = fetch_json(client, &profile_url).await?;
    let version_id = profile["id"]
        .as_str()
        .ok_or("ERR_FABRIC_PROFILE_ID")?
        .to_string();
    save_version_json(game_dir, &version_id, &profile).await?;
    Ok((version_id, profile))
}

async fn resolve_quilt(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
) -> Result<(String, Value), String> {
    if let Some(found) = find_installed_loader_version(game_dir, mc_version, "quilt").await? {
        return Ok(found);
    }

    let loaders_url = format!("https://meta.quiltmc.org/v3/versions/loader/{mc_version}");
    let loaders_val = fetch_json(client, &loaders_url).await?;
    let loaders = loaders_val
        .as_array()
        .ok_or_else(|| format!("ERR_QUILT_NO_LOADER:{mc_version}"))?;
    let loader_version = loaders
        .iter()
        .find(|l| l["loader"]["stable"].as_bool() == Some(true))
        .or_else(|| loaders.first())
        .and_then(|l| l["loader"]["version"].as_str())
        .ok_or_else(|| format!("ERR_QUILT_NO_LOADER:{mc_version}"))?;

    let profile_url = format!(
        "https://meta.quiltmc.org/v3/versions/loader/{loader_version}/profile/game/{mc_version}"
    );
    let profile = fetch_json(client, &profile_url).await?;
    let version_id = profile["id"]
        .as_str()
        .ok_or("ERR_QUILT_PROFILE_ID")?
        .to_string();
    save_version_json(game_dir, &version_id, &profile).await?;
    Ok((version_id, profile))
}

async fn resolve_forge(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    java_path: Option<&str>,
) -> Result<(String, Value), String> {
    if let Some(found) = find_installed_loader_version(game_dir, mc_version, "forge").await? {
        return Ok(found);
    }

    let java = find_java_for_version(java_path, mc_version)?;
    let promos: Value = fetch_json(client, FORGE_PROMOTIONS).await?;
    let recommended_key = format!("{mc_version}-recommended");
    let latest_key = format!("{mc_version}-latest");
    let forge_build = promos["promos"][&recommended_key]
        .as_str()
        .or_else(|| promos["promos"][&latest_key].as_str())
        .ok_or_else(|| format!("ERR_FORGE_NO_VERSION:{mc_version}"))?;

    let full = format!("{mc_version}-{forge_build}");
    let installer_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{full}/forge-{full}-installer.jar"
    );
    let (version_id, version_json) =
        ensure_forge_installed(&java, client, game_dir, mc_version, &installer_url).await?;
    save_version_json(game_dir, &version_id, &version_json).await?;
    Ok((version_id, version_json))
}

async fn resolve_neoforge(
    client: &Client,
    game_dir: &Path,
    mc_version: &str,
    java_path: Option<&str>,
) -> Result<(String, Value), String> {
    if let Some(found) = find_installed_loader_version(game_dir, mc_version, "neoforge").await? {
        return Ok(found);
    }

    let java = find_java_for_version(java_path, mc_version)?;
    let prefix = neoforge_version_prefix(mc_version)
        .ok_or_else(|| format!("ERR_NEOFORGE_BAD_MC:{mc_version}"))?;
    let meta: Value = fetch_json(client, NEOFORGE_VERSIONS).await?;
    let versions = meta["versions"]
        .as_array()
        .ok_or("ERR_NEOFORGE_VERSIONS")?;

    let neoforge_version = versions
        .iter()
        .filter_map(|v| v.as_str())
        .filter(|v| v.starts_with(&prefix) && !v.contains("beta"))
        .max_by(|a, b| compare_version_ids(a, b))
        .ok_or_else(|| format!("ERR_NEOFORGE_NO_VERSION:{mc_version}"))?;

    let installer_url = format!(
        "https://maven.neoforged.net/releases/net/neoforged/neoforge/{neoforge_version}/neoforge-{neoforge_version}-installer.jar"
    );
    let (version_id, version_json) =
        ensure_forge_installed(&java, client, game_dir, mc_version, &installer_url).await?;
    save_version_json(game_dir, &version_id, &version_json).await?;
    Ok((version_id, version_json))
}

fn neoforge_version_prefix(mc_version: &str) -> Option<String> {
    let parts: Vec<&str> = mc_version.split('.').collect();
    if parts.len() >= 2 {
        let minor = parts[1];
        let patch = parts.get(2).copied().unwrap_or("0");
        Some(format!("{minor}.{patch}."))
    } else {
        None
    }
}

/// Reuse loader profile already installed in a modpack folder (e.g. from .mrpack).
async fn find_installed_loader_version(
    game_dir: &Path,
    mc_version: &str,
    loader: &str,
) -> Result<Option<(String, Value)>, String> {
    let versions_dir = game_dir.join("versions");
    let Ok(mut entries) = fs::read_dir(&versions_dir).await else {
        return Ok(None);
    };

    let mut best_id: Option<String> = None;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let version_id = entry.file_name().to_string_lossy().to_string();
        if !version_id_matches_loader(&version_id, mc_version, loader) {
            continue;
        }
        let json_path = path.join(format!("{version_id}.json"));
        if !json_path.is_file() {
            continue;
        }
        match &best_id {
            Some(current) if compare_version_ids(&version_id, current) != std::cmp::Ordering::Greater => {}
            _ => best_id = Some(version_id),
        }
    }

    let Some(version_id) = best_id else {
        return Ok(None);
    };

    let json_path = versions_dir
        .join(&version_id)
        .join(format!("{version_id}.json"));
    let raw = fs::read_to_string(&json_path)
        .await
        .map_err(|e| e.to_string())?;
    let json: Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    Ok(Some((version_id, json)))
}

fn version_id_matches_loader(version_id: &str, mc_version: &str, loader: &str) -> bool {
    match loader {
        "forge" | "optifine" => version_id.starts_with(&format!("{mc_version}-forge-")),
        "neoforge" => version_id.starts_with(&format!("{mc_version}-neoforge-")),
        "fabric" => {
            version_id.contains("fabric")
                && version_id.contains(mc_version)
                && version_id != mc_version
        }
        "quilt" => {
            version_id.contains("quilt")
                && version_id.contains(mc_version)
                && version_id != mc_version
        }
        _ => false,
    }
}

fn compare_version_ids(a: &str, b: &str) -> std::cmp::Ordering {
    let pa: Vec<u32> = a
        .split(|c| c == '.' || c == '-')
        .filter_map(|s| s.parse().ok())
        .collect();
    let pb: Vec<u32> = b
        .split(|c| c == '.' || c == '-')
        .filter_map(|s| s.parse().ok())
        .collect();
    pa.cmp(&pb)
}

pub fn loader_display_name(loader: &str) -> &'static str {
    match loader {
        "fabric" => "Fabric",
        "quilt" => "Quilt",
        "forge" => "Forge",
        "neoforge" => "NeoForge",
        "optifine" => "Forge OptiFine",
        _ => "Vanilla",
    }
}

#[allow(dead_code)]
pub fn loader_version_label(loader: &str, mc_version: &str) -> Value {
    json!({
        "loader": loader,
        "minecraft": mc_version,
        "name": loader_display_name(loader),
    })
}
