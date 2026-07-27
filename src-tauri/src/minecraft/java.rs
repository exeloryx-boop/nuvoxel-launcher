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
        return Ok(path);
    }

    Err(format!("ERR_JAVA_NOT_FOUND:{min_major}|{mc_version}"))
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
