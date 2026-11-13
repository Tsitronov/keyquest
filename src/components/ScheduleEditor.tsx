import { useState } from "react";
import { makeT } from "../i18n";
import { uid, update, useAppState } from "../store";
import type { Reward, Schedule, Step } from "../types";
import { EMOJIS, fileToSmallDataUrl } from "../util";
import { Pic } from "./Pic";

const MINUTES = [0, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

function IconPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="emoji-pop" role="dialog">
      <div className="emoji-grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className="emoji-btn"
            onClick={() => {
              onPick(e);
              onClose();
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PicEditProps {
  icon: string;
  photo?: string;
  onIcon: (e: string) => void;
  onPhoto: (p: string | undefined) => void;
  t: (k: string) => string;
}

function PicEdit({ icon, photo, onIcon, onPhoto, t }: PicEditProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pic-edit">
      <button type="button" className="pic-btn" title={t("choose_icon")} onClick={() => setOpen((o) => !o)}>
        <Pic icon={icon} photo={photo} className="pic-edit-pic" />
      </button>
      <label className="small-btn" title={t("photo")}>
        📷
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              onPhoto(await fileToSmallDataUrl(f));
            } catch {
              /* ignore unreadable files */
            }
          }}
        />
      </label>
      {photo && (
        <button type="button" className="small-btn" title={t("remove_photo")} onClick={() => onPhoto(undefined)}>
          ✕
        </button>
      )}
      {open && <IconPicker onPick={onIcon} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function ScheduleEditor() {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const schedule = app.schedules.find((s) => s.id === app.activeScheduleId) ?? app.schedules[0];
  const [confirmDel, setConfirmDel] = useState(false);

  const edit = (fn: (s: Schedule) => Schedule) =>
    update((st) => ({
      ...st,
      schedules: st.schedules.map((s) => (s.id === schedule.id ? fn(s) : s)),
      // changing a schedule while it is running would confuse the child: restart it
      run: st.run && st.run.scheduleId === schedule.id ? null : st.run,
    }));

  const editStep = (id: string, patch: Partial<Step>) =>
    edit((s) => ({ ...s, steps: s.steps.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const move = (i: number, d: -1 | 1) =>
    edit((s) => {
      const steps = [...s.steps];
      const j = i + d;
      if (j < 0 || j >= steps.length) return s;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...s, steps };
    });

  const editReward = (patch: Partial<Reward>) => edit((s) => ({ ...s, reward: { ...s.reward, ...patch } }));

  const addSchedule = () =>
    update((st) => {
      const id = uid();
      const s: Schedule = {
        id,
        name: t("new_schedule"),
        steps: [{ id: uid(), title: "", icon: "⭐" }],
        reward: { title: "", icon: "🎮", minutes: 10 },
      };
      return { ...st, schedules: [...st.schedules, s], activeScheduleId: id };
    });

  const deleteSchedule = () => {
    update((st) => {
      if (st.schedules.length <= 1) return st;
      const rest = st.schedules.filter((s) => s.id !== schedule.id);
      return {
        ...st,
        schedules: rest,
        activeScheduleId: rest[0].id,
        run: st.run && st.run.scheduleId === schedule.id ? null : st.run,
      };
    });
    setConfirmDel(false);
  };

  return (
    <div className="panel-body">
      <div className="row sched-tabs">
        {app.schedules.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${s.id === schedule.id ? "chip-on" : ""}`}
            onClick={() => update((st) => ({ ...st, activeScheduleId: s.id, run: null }))}
          >
            {s.name || "…"}
          </button>
        ))}
        <button type="button" className="chip chip-add" onClick={addSchedule}>
          ＋
        </button>
      </div>

      <label className="field">
        <span>{t("name")}</span>
        <input value={schedule.name} onChange={(e) => edit((s) => ({ ...s, name: e.target.value }))} />
      </label>

      <h3>{t("steps")}</h3>
      <ol className="steps">
        {schedule.steps.map((st, i) => (
          <li key={st.id} className="step-row">
            <span className="step-num">{i + 1}</span>
            <PicEdit
              icon={st.icon}
              photo={st.photo}
              onIcon={(icon) => editStep(st.id, { icon })}
              onPhoto={(photo) => editStep(st.id, { photo })}
              t={t}
            />
            <input
              className="grow"
              placeholder={t("step_title")}
              value={st.title}
              onChange={(e) => editStep(st.id, { title: e.target.value })}
            />
            <select
              value={st.minutes ?? 0}
              title={t("minutes")}
              onChange={(e) => editStep(st.id, { minutes: Number(e.target.value) || undefined })}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? t("no_timer") : `${m} ${t("min_short")}`}
                </option>
              ))}
            </select>
            <button type="button" className="small-btn" title={t("move_up")} onClick={() => move(i, -1)} disabled={i === 0}>
              ↑
            </button>
            <button
              type="button"
              className="small-btn"
              title={t("move_down")}
              onClick={() => move(i, 1)}
              disabled={i === schedule.steps.length - 1}
            >
              ↓
            </button>
            <button
              type="button"
              className="small-btn danger"
              title={t("delete")}
              disabled={schedule.steps.length <= 1}
              onClick={() => edit((s) => ({ ...s, steps: s.steps.filter((x) => x.id !== st.id) }))}
            >
              🗑
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn"
        onClick={() => edit((s) => ({ ...s, steps: [...s.steps, { id: uid(), title: "", icon: "⭐" }] }))}
      >
        ＋ {t("add_step")}
      </button>

      <h3>{t("reward")}</h3>
      <div className="step-row">
        <PicEdit
          icon={schedule.reward.icon}
          photo={schedule.reward.photo}
          onIcon={(icon) => editReward({ icon })}
          onPhoto={(photo) => editReward({ photo })}
          t={t}
        />
        <input
          className="grow"
          placeholder={t("reward_title")}
          value={schedule.reward.title}
          onChange={(e) => editReward({ title: e.target.value })}
        />
        <select
          value={schedule.reward.minutes ?? 0}
          title={t("reward_minutes")}
          onChange={(e) => editReward({ minutes: Number(e.target.value) || undefined })}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m === 0 ? "—" : `${m} ${t("min_short")}`}
            </option>
          ))}
        </select>
      </div>

      <div className="row gap">
        <button type="button" className="btn" onClick={() => window.print()}>
          🖨 {t("print")}
        </button>
        {app.schedules.length > 1 &&
          (confirmDel ? (
            <>
              <span>{t("confirm_delete")}</span>
              <button type="button" className="btn danger" onClick={deleteSchedule}>
                {t("yes")}
              </button>
              <button type="button" className="btn" onClick={() => setConfirmDel(false)}>
                {t("no")}
              </button>
            </>
          ) : (
            <button type="button" className="btn danger" onClick={() => setConfirmDel(true)}>
              🗑 {t("delete")}
            </button>
          ))}
      </div>
    </div>
  );
}
