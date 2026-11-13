import { makeT } from "../i18n";
import { update, useAppState } from "../store";
import type { AssistLevel } from "../types";
import { formatDateTime } from "../util";
import { Pic } from "./Pic";

const LEVELS: AssistLevel[] = ["independent", "gesture", "verbal", "physical"];

export function Results() {
  const app = useAppState();
  const lang = app.settings.lang;
  const t = makeT(lang);

  const setAssist = (sessionId: string, stepId: string, assist: AssistLevel | null) =>
    update((s) => ({
      ...s,
      sessions: s.sessions.map((x) =>
        x.id !== sessionId
          ? x
          : { ...x, steps: x.steps.map((st) => (st.stepId === stepId ? { ...st, assist } : st)) },
      ),
    }));

  const setNote = (sessionId: string, note: string) =>
    update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, note } : x)) }));

  if (!app.sessions.length) return <div className="panel-body muted">{t("results_empty")}</div>;

  return (
    <div className="panel-body">
      {app.sessions.slice(0, 40).map((ses) => {
        const minutes = ses.finishedAt ? Math.max(1, Math.round((ses.finishedAt - ses.startedAt) / 60000)) : 0;
        const indep = ses.steps.filter((s) => s.assist === "independent").length;
        return (
          <section key={ses.id} className="card">
            <header className="card-head">
              <strong>{ses.scheduleName}</strong>
              <span className="muted">
                {formatDateTime(ses.startedAt, lang)} · {minutes} {t("min_short")}
              </span>
              <span className="badge">
                {t("assist_independent")}: {indep} {t("of")} {ses.steps.length}
              </span>
            </header>
            <ul className="result-steps">
              {ses.steps.map((st) => (
                <li key={st.stepId}>
                  <Pic icon={st.icon} className="mini-pic" />
                  <span className="grow">{st.title}</span>
                  <span className="muted">
                    {st.secondsTaken} {t("seconds")}
                  </span>
                  <select
                    value={st.assist ?? ""}
                    onChange={(e) => setAssist(ses.id, st.stepId, (e.target.value || null) as AssistLevel | null)}
                    title={t("assist")}
                  >
                    <option value="">{t("assist_unrated")}</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {t(`assist_${l}`)}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <input
              className="note-input"
              placeholder={t("note_session")}
              value={ses.note ?? ""}
              onChange={(e) => setNote(ses.id, e.target.value)}
            />
          </section>
        );
      })}
    </div>
  );
}
