import { useMemo, useState } from "react";
import { makeT } from "../i18n";
import { uid, update, useAppState } from "../store";
import type { AbcEntry } from "../types";
import { csvCell, formatDateTime } from "../util";

export function toCsv(entries: AbcEntry[]): string {
  const head = ["date", "antecedent", "behavior", "consequence", "duration_min", "intensity", "note"];
  const rows = entries.map((e) =>
    [new Date(e.at).toISOString(), e.antecedent, e.behavior, e.consequence, e.durationMin, e.intensity, e.note]
      .map(csvCell)
      .join(";"),
  );
  return [head.join(";"), ...rows].join("\n");
}

export function AbcLog() {
  const app = useAppState();
  const lang = app.settings.lang;
  const t = makeT(lang);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [dur, setDur] = useState("");
  const [inten, setInten] = useState<1 | 2 | 3>(1);
  const [note, setNote] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const [copied, setCopied] = useState(false);

  // The most frequent "before" situations: this is what a clinician looks at first.
  const topA = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of app.abc) {
      const k = e.antecedent.trim().toLowerCase();
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
  }, [app.abc]);

  const add = () => {
    if (!a.trim() && !b.trim() && !c.trim()) return;
    const entry: AbcEntry = {
      id: uid(),
      at: Date.now(),
      antecedent: a.trim(),
      behavior: b.trim(),
      consequence: c.trim(),
      durationMin: dur ? Math.max(0, Number(dur)) || undefined : undefined,
      intensity: inten,
      note: note.trim() || undefined,
    };
    update((s) => ({ ...s, abc: [entry, ...s.abc].slice(0, 1000) }));
    setA("");
    setB("");
    setC("");
    setDur("");
    setNote("");
    setInten(1);
  };

  const csv = toCsv(app.abc);

  return (
    <div className="panel-body">
      <h3>{t("log_title")}</h3>
      <p className="muted">{t("log_hint")}</p>

      <div className="abc-form">
        <label className="field">
          <span>{t("antecedent")}</span>
          <input value={a} onChange={(e) => setA(e.target.value)} list="abc-a" />
        </label>
        <label className="field">
          <span>{t("behavior")}</span>
          <input value={b} onChange={(e) => setB(e.target.value)} />
        </label>
        <label className="field">
          <span>{t("consequence")}</span>
          <input value={c} onChange={(e) => setC(e.target.value)} />
        </label>
        <div className="row gap">
          <label className="field">
            <span>{t("duration")}</span>
            <input type="number" min={0} value={dur} onChange={(e) => setDur(e.target.value)} style={{ width: 90 }} />
          </label>
          <label className="field">
            <span>{t("intensity")}</span>
            <select value={inten} onChange={(e) => setInten(Number(e.target.value) as 1 | 2 | 3)}>
              <option value={1}>{t("intensity_1")}</option>
              <option value={2}>{t("intensity_2")}</option>
              <option value={3}>{t("intensity_3")}</option>
            </select>
          </label>
          <label className="field grow">
            <span>{t("note")}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </div>
        <datalist id="abc-a">
          {topA.map(([k]) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <div className="row gap">
          <button type="button" className="btn primary" onClick={add}>
            ＋ {t("add_entry")}
          </button>
          {app.abc.length > 0 && (
            <button type="button" className="btn" onClick={() => setShowCsv((v) => !v)}>
              {t("export")} CSV
            </button>
          )}
        </div>
      </div>

      {showCsv && (
        <div className="export-box">
          <textarea readOnly value={csv} rows={6} onFocus={(e) => e.currentTarget.select()} />
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(csv);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                /* the text is selectable anyway */
              }
            }}
          >
            {copied ? `✔ ${t("copied")}` : t("export_copy")}
          </button>
        </div>
      )}

      {topA.length > 0 && (
        <div className="row gap wrap">
          {topA.map(([k, n]) => (
            <span key={k} className="badge">
              {k} ×{n}
            </span>
          ))}
        </div>
      )}

      {app.abc.length === 0 ? (
        <p className="muted">{t("empty_log")}</p>
      ) : (
        <ul className="abc-list">
          {app.abc.slice(0, 60).map((e) => (
            <li key={e.id} className="card">
              <div className="card-head">
                <span className="muted">{formatDateTime(e.at, lang)}</span>
                {e.durationMin ? (
                  <span className="badge">
                    {e.durationMin} {t("min_short")}
                  </span>
                ) : null}
                {e.intensity ? <span className="badge">{t(`intensity_${e.intensity}`)}</span> : null}
                <button
                  type="button"
                  className="small-btn danger push-right"
                  title={t("delete")}
                  onClick={() => update((s) => ({ ...s, abc: s.abc.filter((x) => x.id !== e.id) }))}
                >
                  🗑
                </button>
              </div>
              <div className="abc-cols">
                <div>
                  <b>A</b> {e.antecedent}
                </div>
                <div>
                  <b>B</b> {e.behavior}
                </div>
                <div>
                  <b>C</b> {e.consequence}
                </div>
              </div>
              {e.note && <div className="muted">{e.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
