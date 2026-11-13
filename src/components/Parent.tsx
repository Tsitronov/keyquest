import { useState } from "react";
import { makeT } from "../i18n";
import { useAppState } from "../store";
import { AbcLog } from "./AbcLog";
import { Results } from "./Results";
import { ScheduleEditor } from "./ScheduleEditor";
import { SettingsTab } from "./SettingsTab";

type Tab = "schedule" | "results" | "log" | "settings";

function PinGate({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    if (val.length >= 4) return;
    const next = val + d;
    setWrong(false);
    setVal(next);
    if (next.length === 4) {
      if (next === app.settings.pin) onOk();
      else {
        setWrong(true);
        window.setTimeout(() => setVal(""), 350);
      }
    }
  };

  return (
    <div className="pin-wrap">
      <div className={`pin-card ${wrong ? "shake" : ""}`}>
        <h2>{t("pin_title")}</h2>
        <div className="pin-dots" aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i < val.length ? "on" : ""} />
          ))}
        </div>
        {wrong && <div className="err-text">{t("pin_wrong")}</div>}
        {app.settings.pin === "0000" && <div className="muted small">{t("pin_default_warn")}</div>}
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" onClick={onCancel} className="keypad-sub">
            ✕
          </button>
          <button type="button" onClick={() => press("0")}>
            0
          </button>
          <button type="button" onClick={() => setVal((v) => v.slice(0, -1))} className="keypad-sub">
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}

export function Parent({ onExit }: { onExit: () => void }) {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("schedule");

  if (!unlocked) return <PinGate onOk={() => setUnlocked(true)} onCancel={onExit} />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "schedule", label: t("tab_schedule") },
    { id: "results", label: t("tab_results") },
    { id: "log", label: t("tab_log") },
    { id: "settings", label: t("tab_settings") },
  ];

  return (
    <div className="screen parent">
      <header className="parent-head">
        <h2>{t("parent")}</h2>
        <nav className="tabs">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`tab ${tab === x.id ? "tab-on" : ""}`}
              onClick={() => setTab(x.id)}
            >
              {x.label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn primary" onClick={onExit}>
          {t("close")}
        </button>
      </header>
      <main className="parent-main">
        {tab === "schedule" && <ScheduleEditor />}
        {tab === "results" && <Results />}
        {tab === "log" && <AbcLog />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
