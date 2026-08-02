use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn resolve_java_executable(path: &Path) -> PathBuf {
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");
    if file_name.eq_ignore_ascii_case("javaw.exe") {
        if let Some(parent) = path.parent() {
            let java = parent.join("java.exe");
            if java.exists() {
                return java;
            }
        }
    }
    path.to_path_buf()
}

pub fn find_java_for_version(
    custom_path: Option<&str>,
    mc_version: &str,
) -> Result<PathBuf, String> {
    if let Some(path) = custom_path {
        let trimmed = path.trim();
        if !trimmed.is_empty() {
            let p = resolve_java_executable(Path::new(trimmed));
            if p.exists() {
                let min_major = min_java_major_for_version(mc_version);
                let major = java_major_version(&p).unwrap_or(min_major);
                if major < min_major {
                    return Err(format!(
                        "ERR_JAVA_TOO_OLD:{major}|{min_major}|{mc_version}"
                    ));
                }
                return Ok(p);
            }
            return Err(format!("ERR_JAVA_PATH_INVALID:{trimmed}"));
        }
    }

    let min_major = min_java_major_for_version(mc_version);
    let candidates = java_candidates_for_major(min_major);

    for candidate in candidates {
        if candidate.exists() {
            if java_major_version(&candidate).unwrap_or(min_major) >= min_major {
                return Ok(candidate);
            }
        }
    }

    if let Ok(path) = find_java(None) {
        let major = java_major_version(&path).unwrap_or(0);
        if major >= min_major {
            return Ok(path);
        }
        return Err(format!("ERR_JAVA_TOO_OLD:{major}|{min_major}|{mc_version}"));
    }

    Err(format!("ERR_JAVA_NOT_FOUND:{min_major}|{mc_version}"))
}

/// Current Minecraft releases need Java 21 or 25. When the required runtime
/// is not installed system-wide, download it privately instead of asking the
/// player to change their system Java installation.
pub async fn find_or_install_java_for_version(
    custom_path: Option<&str>,
    mc_version: &str,
    game_dir: &Path,
) -> Result<PathBuf, String> {
    match find_java_for_version(custom_path, mc_version) {
        Ok(path) => return Ok(path),
        Err(_) if custom_path.map(str::trim).unwrap_or("").is_empty() => {}
        Err(error) => return Err(error),
    }

    let min_major = min_java_major_for_version(mc_version);
    let runtime_root = game_dir
        .parent()
        .filter(|parent| {
            parent
                .file_name()
                .is_some_and(|name| name.eq_ignore_ascii_case(".nuvoxel"))
        })
        .and_then(Path::parent)
        .unwrap_or(game_dir);
    let runtime_dir = runtime_root
        .join(".nuvolexlauncher")
        .join("runtimes")
        .join(format!("java-{min_major}"));
    if let Some(java) = find_java_recursively(&runtime_dir) {
        if java_major_version(&java).unwrap_or(0) >= min_major {
            return Ok(java);
        }
    }

    let url = format!(
        "https://api.adoptium.net/v3/binary/latest/{min_major}/ga/windows/x64/jre/hotspot/normal/eclipse"
    );
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("ERR_JAVA_RUNTIME_DOWNLOAD:{e}"))?;
    if !response.status().is_success() {
        return Err(format!("ERR_JAVA_RUNTIME_DOWNLOAD:HTTP {}", response.status()));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("ERR_JAVA_RUNTIME_DOWNLOAD:{e}"))?;

    std::fs::create_dir_all(&runtime_dir).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes))
        .map_err(|e| format!("ERR_JAVA_RUNTIME_ARCHIVE:{e}"))?;
    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("ERR_JAVA_RUNTIME_ARCHIVE:{e}"))?;
        let Some(relative) = entry.enclosed_name().map(PathBuf::from) else {
            continue;
        };
        let output = runtime_dir.join(relative);
        if entry.is_dir() {
            std::fs::create_dir_all(&output).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = output.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut file = std::fs::File::create(&output).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut file).map_err(|e| e.to_string())?;
        }
    }

    find_java_recursively(&runtime_dir)
        .filter(|java| java_major_version(java).unwrap_or(0) >= min_major)
        .ok_or_else(|| format!("ERR_JAVA_NOT_FOUND:{min_major}|{mc_version}"))
}

pub fn find_java(custom_path: Option<&str>) -> Result<PathBuf, String> {
    find_java_for_version(custom_path, "1.21.4")
}

fn java_candidates_for_major(min_major: u32) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    for pattern in java_search_paths() {
        if let Some(p) = glob_first(&pattern) {
            paths.push(p);
        }
    }
    paths.sort_by(|a, b| {
        java_major_version(b)
            .unwrap_or(0)
            .cmp(&java_major_version(a).unwrap_or(0))
    });
    paths.retain(|p| java_major_version(p).unwrap_or(8) >= min_major);
    paths
}

fn java_major_version(java: &Path) -> Option<u32> {
    let output = Command::new(java).arg("-version").output().ok()?;
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let text = format!("{stderr}{stdout}");
    parse_java_major(&text)
}

fn parse_java_major(text: &str) -> Option<u32> {
    if let Some(pos) = text.find('"') {
        let rest = &text[pos + 1..];
        if let Some(end) = rest.find('"') {
            let ver = &rest[..end];
            if ver.starts_with("1.8") || ver.starts_with("1.7") || ver.starts_with("1.6") {
                return Some(8);
            }
            if ver.starts_with("1.") {
                return ver.split('.').nth(1)?.parse().ok();
            }
            return ver.split('.').next()?.parse().ok();
        }
    }
    None
}

fn java_search_paths() -> Vec<String> {
    vec![
        r"C:\Program Files\Java\*\bin\java.exe".into(),
        r"C:\Program Files\Eclipse Adoptium\*\bin\java.exe".into(),
        r"C:\Program Files\Microsoft\jdk-*\bin\java.exe".into(),
        r"C:\Program Files\Zulu\*\bin\java.exe".into(),
        r"C:\Program Files (x86)\Java\*\bin\java.exe".into(),
        r"C:\Program Files\BellSoft\*\bin\java.exe".into(),
    ]
}

fn glob_first(pattern: &str) -> Option<PathBuf> {
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 2 {
        let base = Path::new(parts[0].trim_end_matches('\\'));
        if !base.exists() {
            return None;
        }
        let suffix = parts[1].trim_start_matches('\\');
        if let Ok(entries) = std::fs::read_dir(base) {
            let mut dirs: Vec<_> = entries.flatten().collect();
            dirs.sort_by_key(|e| e.file_name());
            for entry in dirs.into_iter().rev() {
                if entry.path().is_dir() {
                    let candidate = entry.path().join(suffix);
                    if candidate.exists() {
                        return Some(candidate);
                    }
                }
            }
        }
    }
    None
}

pub fn min_java_major_for_version(version: &str) -> u32 {
    if version
        .split('.')
        .next()
        .and_then(|part| part.parse::<u32>().ok())
        .is_some_and(|major| major >= 26)
    {
        return 25;
    }
    if !version.starts_with('1') {
        return 21;
    }
    let parts: Vec<u32> = version
        .split('.')
        .filter_map(|p| p.parse().ok())
        .collect();
    if parts.first() != Some(&1) {
        return 21;
    }
    let minor = parts.get(1).copied().unwrap_or(0);
    let patch = parts.get(2).copied().unwrap_or(0);
    if minor >= 21 {
        return 21;
    }
    if minor >= 20 && patch >= 5 {
        return 21;
    }
    if minor >= 18 {
        return 17;
    }
    if minor == 17 {
        return 16;
    }
    if minor <= 16 {
        return 8;
    }
    8
}

fn find_java_recursively(root: &Path) -> Option<PathBuf> {
    if !root.exists() {
        return None;
    }
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(dir) else { continue };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if path
                .file_name()
                .is_some_and(|name| name.eq_ignore_ascii_case("java.exe"))
            {
                return Some(path);
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::min_java_major_for_version;

    #[test]
    fn nuvoxel_versions_use_the_required_java_release() {
        for version in [
            "1.21.4", "1.21.5", "1.21.6", "1.21.7", "1.21.8", "1.21.9", "1.21.10",
            "1.21.11",
        ] {
            assert_eq!(min_java_major_for_version(version), 21, "{version}");
        }

        for version in ["26.1", "26.1.1", "26.1.2", "26.2"] {
            assert_eq!(min_java_major_for_version(version), 25, "{version}");
        }
    }
}
