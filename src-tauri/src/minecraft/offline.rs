use std::path::Path;
use uuid::Uuid;

use super::uuid_util::offline_uuid;

pub fn offline_access_token() -> String {
    Uuid::new_v4().to_string().replace('-', "")
}

pub async fn setup_offline_session(
    game_dir: &Path,
    username: &str,
    language: Option<&str>,
) -> Result<(String, String), String> {
    let uuid = offline_uuid(username);
    let uuid_str = uuid.to_string();
    let access_token = offline_access_token();

    for dir in ["skins", "logs", "saves", "resourcepacks", "shaderpacks"] {
        tokio::fs::create_dir_all(game_dir.join(dir))
            .await
            .map_err(|e| e.to_string())?;
    }

    write_launcher_profiles(game_dir, username, &uuid_str).await?;
    write_options_defaults(game_dir, language).await?;

    Ok((uuid_str, access_token))
}

async fn write_launcher_profiles(
    game_dir: &Path,
    username: &str,
    uuid: &str,
) -> Result<(), String> {
    let path = game_dir.join("launcher_profiles.json");
    if path.exists() {
        return Ok(());
    }

    let profile_id = Uuid::new_v4().to_string();
    let now = unix_now();

    let mut inner_profiles = serde_json::Map::new();
    inner_profiles.insert(
        profile_id.clone(),
        serde_json::json!({
            "displayName": username,
            "name": username
        }),
    );

    let mut auth_db = serde_json::Map::new();
    auth_db.insert(
        uuid.to_string(),
        serde_json::json!({
            "username": username,
            "profiles": inner_profiles
        }),
    );

    let doc = serde_json::json!({
        "profiles": {
            "NuvolexLauncher": {
                "name": "NuvolexLauncher",
                "type": "latest-release",
                "created": now,
                "lastUsed": now
            }
        },
        "selectedProfile": "NuvolexLauncher",
        "clientToken": Uuid::new_v4().to_string(),
        "authenticationDatabase": auth_db,
        "selectedUser": {
            "account": uuid,
            "profile": profile_id
        }
    });

    tokio::fs::write(&path, serde_json::to_string_pretty(&doc).unwrap_or_default())
        .await
        .map_err(|e| e.to_string())
}

async fn write_options_defaults(game_dir: &Path, language: Option<&str>) -> Result<(), String> {
    let path = game_dir.join("options.txt");
    if path.exists() {
        return Ok(());
    }
    let lang = match language.unwrap_or("ru") {
        "uk" => "uk_ua",
        "en" => "en_us",
        _ => "ru_ru",
    };
    tokio::fs::write(path, format!("lang:{lang}\n"))
        .await
        .map_err(|e| e.to_string())
}

fn unix_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".into())
}
