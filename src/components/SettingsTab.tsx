import { useState } from "react";
import { LANGS, makeT } from "../i18n";
import { getState, update, useAppState } from "../store";
import type { AppState, Lang } from "../types";

export function SettingsTab() {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const [pin, setPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState(false);
  const [copied, setCopied] = useState(false);

  const setSettings = (patch: Partial<AppState["settings"]>) =>
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const exportJson = JSON.stringify(getState());

  const doImport = () => {
    try {
      const data = JSON.parse(importText) as Partial<AppState>;
      if (!data || !Array.isArray(data.schedules) || !data.schedules.length) throw new Error("bad");
      update((s) => ({
        ...s,
        schedules: data.schedules!,
        activeScheduleId: data.activeScheduleId ?? data.schedules![0].id,
        sessions: Array.isArray(data.sessions) ? data.sessions : s.sessions,
        abc: Array.isArray(data.abc) ? data.abc : s.abc,
        run: null,
      }));
      setImportText("");
      setImportErr(false);
    } catch {
      setImportErr(true);
    }
  };

  return (
    <div className="panel-body">
      <label className="field">
        <span>{t("settings_lang")}</span>
        <select value={app.settings.lang} onChange={(e) => setSettings({ lang: e.target.value as Lang })}>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="check">
        <input type="checkbox" checked={app.settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />
        {t("settings_sound")}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={app.settings.calmMotion}
          onChange={(e) => setSettings({ calmMotion: e.target.checked })}
        />
        {t("settings_calm")}
      </label>

      <div className="row gap">
        <label className="field">
          <span>{t("settings_pin")}</span>
          <input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setPinSaved(false);
            }}
            style={{ width: 110 }}
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={pin.length !== 4}
          onClick={() => {
            setSettings({ pin });
            setPin("");
            setPinSaved(true);
          }}
        >
          {t("settings_pin_save")}
        </button>
        {pinSaved && <span className="ok-text">✔ {t("settings_pin_saved")}</span>}
      </div>

      <button type="button" className="btn" onClick={() => update((s) => ({ ...s, run: null }))}>
        ↺ {t("settings_reset_run")}
      </button>

      <h3>{t("settings_backup")}</h3>
      <p className="muted">{t("settings_backup_hint")}</p>
      <div className="row gap">
        <button type="button" className="btn" onClick={() => setShowExport((v) => !v)}>
          {t("export")} JSON
        </button>
      </div>
      {showExport && (
        <div className="export-box">
          <textarea readOnly rows={5} value={exportJson} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(exportJson);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                /* selectable anyway */
              }
            }}
          >
            {copied ? `✔ ${t("copied")}` : t("export_copy")}
          </button>
        </div>
      )}
      <div className="export-box">
        <textarea
          rows={3}
          placeholder="JSON"
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            setImportErr(false);
          }}
        />
        <button type="button" className="btn" disabled={!importText.trim()} onClick={doImport}>
          ⇩ Import
        </button>
        {importErr && <span className="err-text">JSON?</span>}
      </div>
    </div>
  );
}
