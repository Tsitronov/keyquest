import { makeT } from "../i18n";
import { activeSchedule, useAppState } from "../store";
import { Pic } from "./Pic";

/** A paper copy of the schedule. Hidden on screen, shown only when printing. */
export function PrintSheet() {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const s = activeSchedule(app);
  return (
    <div className="print-sheet">
      <h1>{s.name}</h1>
      <div className="print-grid">
        {s.steps.map((st, i) => (
          <div className="print-card" key={st.id}>
            <div className="print-num">{i + 1}</div>
            <Pic icon={st.icon} photo={st.photo} className="print-pic" />
            <div className="print-title">{st.title}</div>
            {st.minutes ? (
              <div className="print-min">
                {st.minutes} {t("min_short")}
              </div>
            ) : null}
          </div>
        ))}
        <div className="print-card print-reward">
          <div className="print-num">{t("then")}</div>
          <Pic icon={s.reward.icon} photo={s.reward.photo} className="print-pic" />
          <div className="print-title">{s.reward.title}</div>
        </div>
      </div>
    </div>
  );
}
