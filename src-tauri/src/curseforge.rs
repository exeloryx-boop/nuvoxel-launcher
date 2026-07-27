use std::fs;
use std::path::PathBuf;

const CF_BASE: &str = "https://api.curseforge.com/v1";

fn load_env_key() -> Option<String> {
    if let Ok(key) = std::env::var("CURSEFORGE_API_KEY") {
        let key = key.trim().trim_matches('"').to_string();
        if !key.is_empty() {
            return Some(key);
        }
    }
    if let Ok(key) = std::env::var("VITE_CURSEFORGE_API_KEY") {
        let key = key.trim().trim_matches('"').to_string();
        if !key.is_empty() {
            return Some(key);
        }
    }

    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join(".env"));
        candidates.push(cwd.join("..").join(".env"));
        candidates.push(cwd.join("..").join("..").join(".env"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join(".env"));
            candidates.push(dir.join("..").join(".env"));
            candidates.push(dir.join("..").join("..").join(".env"));
        }
    }
    if let Some(config) = dirs::config_dir() {
        let app_config = config.join("nuvolexlauncher");
        candidates.push(app_config.join(".env"));
        candidates.push(app_config.join("curseforge.key"));
    }

    for path in candidates {
        if !path.exists() {
            continue;
        }
        if path.extension().is_some_and(|ext| ext == "key") {
            let Ok(content) = fs::read_to_string(&path) else {
                continue;
            };
            let val = content.trim().to_string();
            if !val.is_empty() {
                return Some(val);
            }
            continue;
        }
        let Ok(content) = fs::read_to_string(&path) else {
            continue;
        };
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }
            let Some((key, val)) = trimmed.split_once('=') else {
                continue;
            };
            if key.trim() != "CURSEFORGE_API_KEY" && key.trim() != "VITE_CURSEFORGE_API_KEY" {
                continue;
            }
            let mut val = val.trim().to_string();
            if (val.starts_with('"') && val.ends_with('"'))
                || (val.starts_with('\'') && val.ends_with('\''))
            {
                val = val[1..val.len() - 1].to_string();
            }
            if !val.is_empty() {
                return Some(val);
            }
        }
    }

    None
}

fn resolve_api_key(api_key: Option<String>) -> Result<String, String> {
    if let Some(key) = api_key.filter(|k| !k.trim().is_empty()) {
        return Ok(key.trim().to_string());
    }
    load_env_key().ok_or_else(|| "CURSEFORGE_NO_KEY".into())
}

#[tauri::command]
pub fn curseforge_available(api_key: Option<String>) -> bool {
    resolve_api_key(api_key).is_ok()
}

#[tauri::command]
pub async fn curseforge_fetch(
    path: String,
    api_key: Option<String>,
    method: Option<String>,
    body: Option<String>,
) -> Result<String, String> {
    let key = resolve_api_key(api_key)?;
    let url = format!("{CF_BASE}{path}");
    let http_method = method.unwrap_or_else(|| "GET".into());

    let client = reqwest::Client::new();
    let mut req = client
        .request(
            reqwest::Method::from_bytes(http_method.as_bytes())
                .map_err(|e| format!("CurseForge method error: {e}"))?,
            &url,
        )
        .header("x-api-key", key)
        .header("Accept", "application/json");

    if http_method != "GET" && http_method != "HEAD" {
        req = req.header("Content-Type", "application/json");
        if let Some(payload) = body {
            req = req.body(payload);
        } else {
            req = req.body("{}");
        }
    }

    let res = req
        .send()
        .await
        .map_err(|e| format!("CurseForge network error: {e}"))?;

    if !res.status().is_success() {
        return Err(format!("CurseForge API error: {}", res.status()));
    }

    res.text()
        .await
        .map_err(|e| format!("CurseForge read error: {e}"))
}
