mod store;

use tauri::Manager;

fn data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

/// Returns the saved state JSON, or null on first launch.
#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Result<Option<String>, String> {
    store::load(&data_dir(&app)?)
}

/// Saves the full state JSON atomically.
#[tauri::command]
fn save_state(app: tauri::AppHandle, json: String) -> Result<(), String> {
    store::save(&data_dir(&app)?, &json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_state, save_state])
        .run(tauri::generate_context!())
        .expect("error while running KeyQuest");
}
