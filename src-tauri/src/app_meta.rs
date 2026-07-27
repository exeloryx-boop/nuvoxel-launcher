pub fn user_agent() -> String {
    format!(
        "NuvolexLauncher/{} (minecraft-launcher; contact@nuvoxel.net)",
        env!("CARGO_PKG_VERSION")
    )
}

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
