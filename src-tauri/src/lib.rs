mod app_meta;
mod curseforge;
mod minecraft;
mod updater;

use curseforge::{curseforge_available, curseforge_fetch};

use minecraft::launch::{detect_java, launch_minecraft};
use minecraft::{
    add_server_to_servers_dat, copy_mod_file, copy_pack_file, copy_pack_folder, delete_mod_file,
    delete_pack_folder, download_mod_file, install_modrinth_modpack, list_mod_files,
    list_pack_assets, open_folder, path_is_directory,
};

use updater::{app_version, install_launcher_update};
use serde::Serialize;

#[tauri::command]
fn pick_folder() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|p| p.to_string_lossy().into())
}

#[tauri::command]
fn pick_java_executable() -> Option<String> {
    rfd::FileDialog::new()
        .add_filter("Java", &["exe"])
        .set_title("java.exe")
        .pick_file()
        .map(|p| p.to_string_lossy().into())
}

#[tauri::command]
fn default_minecraft_dir() -> String {
    dirs::data_dir()
        .map(|d| d.join(".minecraft").to_string_lossy().into_owned())
        .unwrap_or_else(|| ".minecraft".into())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeSystemInfo {
    ram_mb: Option<u64>,
    cpu_cores: usize,
}

#[cfg(windows)]
#[repr(C)]
struct MemoryStatusEx {
    dw_length: u32,
    dw_memory_load: u32,
    ull_total_phys: u64,
    ull_avail_phys: u64,
    ull_total_page_file: u64,
    ull_avail_page_file: u64,
    ull_total_virtual: u64,
    ull_avail_virtual: u64,
    ull_avail_extended_virtual: u64,
}

#[cfg(windows)]
extern "system" {
    fn GlobalMemoryStatusEx(status: *mut MemoryStatusEx) -> i32;
}

#[cfg(windows)]
fn physical_memory_mb() -> Option<u64> {
    let mut status = MemoryStatusEx {
        dw_length: std::mem::size_of::<MemoryStatusEx>() as u32,
        dw_memory_load: 0,
        ull_total_phys: 0,
        ull_avail_phys: 0,
        ull_total_page_file: 0,
        ull_avail_page_file: 0,
        ull_total_virtual: 0,
        ull_avail_virtual: 0,
        ull_avail_extended_virtual: 0,
    };
    // Windows owns and fills this FFI struct; the layout above is the Win32
    // MEMORYSTATUSEX layout.
    if unsafe { GlobalMemoryStatusEx(&mut status) } == 0 {
        return None;
    }
    Some(status.ull_total_phys / 1024 / 1024)
}

#[cfg(not(windows))]
fn physical_memory_mb() -> Option<u64> {
    None
}

#[tauri::command]
fn system_info() -> NativeSystemInfo {
    NativeSystemInfo {
        ram_mb: physical_memory_mb(),
        cpu_cores: std::thread::available_parallelism()
            .map(|count| count.get())
            .unwrap_or(4),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            launch_minecraft,
            detect_java,
            download_mod_file,
            install_modrinth_modpack,
            delete_mod_file,
            copy_mod_file,
            copy_pack_file,
            copy_pack_folder,
            delete_pack_folder,
            list_mod_files,
            list_pack_assets,
            path_is_directory,
            open_folder,
            pick_folder,
            pick_java_executable,
            default_minecraft_dir,
            system_info,
            app_version,
            install_launcher_update,
            curseforge_available,
            curseforge_fetch,
            add_server_to_servers_dat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
