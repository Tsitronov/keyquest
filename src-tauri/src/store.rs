//! Local persistence. No Tauri types here so it can be unit-tested on its own.
//!
//! The whole app state is one JSON document. Writes are atomic (temp file +
//! rename) and the previous version is kept as a `.bak` so a crash or a full
//! disk can never leave the family without their schedule.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

const FILE: &str = "state.json";
const BACKUP: &str = "state.json.bak";
const TMP: &str = "state.json.tmp";
/// Photos are stored as data URLs inside the state, so allow a generous cap.
pub const MAX_BYTES: usize = 40 * 1024 * 1024;

fn path(dir: &Path, name: &str) -> PathBuf {
    dir.join(name)
}

/// Returns the saved JSON, falling back to the backup if the main file is
/// missing or corrupted. Returns `None` when nothing has been saved yet.
pub fn load(dir: &Path) -> Result<Option<String>, String> {
    for name in [FILE, BACKUP] {
        let p = path(dir, name);
        if !p.exists() {
            continue;
        }
        let text = fs::read_to_string(&p).map_err(|e| format!("read {}: {e}", p.display()))?;
        if serde_json::from_str::<serde_json::Value>(&text).is_ok() {
            return Ok(Some(text));
        }
    }
    Ok(None)
}

/// Validates and atomically writes the state.
pub fn save(dir: &Path, json: &str) -> Result<(), String> {
    if json.len() > MAX_BYTES {
        return Err(format!("state too large ({} bytes)", json.len()));
    }
    serde_json::from_str::<serde_json::Value>(json).map_err(|e| format!("invalid JSON: {e}"))?;
    fs::create_dir_all(dir).map_err(|e| format!("create dir: {e}"))?;

    let tmp = path(dir, TMP);
    {
        let mut f = fs::File::create(&tmp).map_err(|e| format!("create tmp: {e}"))?;
        f.write_all(json.as_bytes()).map_err(|e| format!("write tmp: {e}"))?;
        f.sync_all().map_err(|e| format!("sync tmp: {e}"))?;
    }

    let main = path(dir, FILE);
    if main.exists() {
        // Best effort: a failed backup must not block saving.
        let _ = fs::copy(&main, path(dir, BACKUP));
    }
    fs::rename(&tmp, &main).map_err(|e| format!("rename: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tempdir(tag: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("keyquest-test-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&d);
        d
    }

    #[test]
    fn empty_dir_returns_none() {
        let d = tempdir("empty");
        assert_eq!(load(&d).unwrap(), None);
    }

    #[test]
    fn roundtrip() {
        let d = tempdir("rt");
        save(&d, r#"{"a":1}"#).unwrap();
        assert_eq!(load(&d).unwrap().as_deref(), Some(r#"{"a":1}"#));
    }

    #[test]
    fn rejects_invalid_json_and_keeps_old_state() {
        let d = tempdir("bad");
        save(&d, r#"{"ok":true}"#).unwrap();
        assert!(save(&d, "{not json").is_err());
        assert_eq!(load(&d).unwrap().as_deref(), Some(r#"{"ok":true}"#));
    }

    #[test]
    fn falls_back_to_backup_when_main_is_corrupt() {
        let d = tempdir("bak");
        save(&d, r#"{"v":1}"#).unwrap();
        save(&d, r#"{"v":2}"#).unwrap();
        fs::write(path(&d, FILE), "garbage").unwrap();
        assert_eq!(load(&d).unwrap().as_deref(), Some(r#"{"v":1}"#));
    }

    #[test]
    fn rejects_oversized_state() {
        let d = tempdir("big");
        let big = format!("\"{}\"", "x".repeat(MAX_BYTES));
        assert!(save(&d, &big).is_err());
    }
}
