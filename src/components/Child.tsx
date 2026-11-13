import { useEffect, useRef, useState } from "react";
import { sounds } from "../audio";
import { makeT } from "../i18n";
import { activeSchedule, uid, update, useAppState } from "../store";
import type { Run, Schedule, Session, SessionStep } from "../types";
import { Door, type KeyPhase } from "./Door";
import { Pic } from "./Pic";
import { TimerRing } from "./TimerRing";

interface Props {
  onOpenParent: () => void;
}

const HOLD_MS = 1300;

/** Gear that must be held down, so a child does not wander into the parent area. */
function HoldGear({ onDone, hint }: { onDone: () => void; hint: string }) {
  const timer = useRef<number | undefined>(undefined);
  const [holding, setHolding] = useState(false);
  const cancel = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };
  return (
    <button
      type="button"
      className={`gear ${holding ? "gear-holding" : ""}`}
      title={hint}
      aria-label={hint}
      onPointerDown={() => {
        setHolding(true);
        timer.current = window.setTimeout(() => {
          setHolding(false);
          onDone();
        }, HOLD_MS);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="gear-fill" style={{ animationDuration: `${HOLD_MS}ms` }} />
      <span className="gear-icon">⚙</span>
    </button>
  );
}

function Sparkles() {
  return (
    <div className="sparkles" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const d = 120 + (i % 3) * 40;
        return (
          <span
            key={i}
            style={{
              ["--dx" as string]: `${Math.cos(a) * d}px`,
              ["--dy" as string]: `${Math.sin(a) * d * 0.8}px`,
              animationDelay: `${(i % 5) * 40}ms`,
            }}
          >
            {i % 2 ? "✦" : "★"}
          </span>
        );
      })}
    </div>
  );
}

function FirstThen({
  schedule,
  stepIndex,
  allDone,
  t,
}: {
  schedule: Schedule;
  stepIndex: number;
  allDone: boolean;
  t: (k: string) => string;
}) {
  const step = schedule.steps[Math.min(stepIndex, schedule.steps.length - 1)];
  const r = schedule.reward;
  return (
    <div className="firstthen">
      <div className="ft-card ft-first">
        <div className="ft-tag">{t("first")}</div>
        <Pic icon={step.icon} photo={step.photo} className="ft-pic" />
        <div className="ft-title">{step.title}</div>
      </div>
      <div className="ft-arrow" aria-hidden="true">
        ➜
      </div>
      <div className={`ft-card ft-then ${allDone ? "" : "ft-locked"}`}>
        <div className="ft-tag">{t("then")}</div>
        <Pic icon={r.icon} photo={r.photo} className="ft-pic" />
        <div className="ft-title">{r.title}</div>
        {!allDone && <span className="ft-lock">🔒</span>}
      </div>
    </div>
  );
}

function Hallway({ schedule, current, allDone }: { schedule: Schedule; current: number; allDone: boolean }) {
  return (
    <div className="hallway">
      {schedule.steps.map((s, i) => {
        const done = allDone || i < current;
        return (
          <div className={`hall-item ${i === current && !allDone ? "hall-current" : ""}`} key={s.id}>
            <Door
              open={done ? 1 : 0}
              state={done ? "done" : i === current ? "current" : "future"}
              behindIcon={s.icon}
              behindPhoto={s.photo}
              num={i + 1}
            />
          </div>
        );
      })}
    </div>
  );
}

export function Child({ onOpenParent }: Props) {
  const app = useAppState();
  const t = makeT(app.settings.lang);
  const schedule = activeSchedule(app);
  const run = app.run && app.run.scheduleId === schedule.id ? app.run : null;
  const calm = app.settings.calmMotion;
  const sound = app.settings.sound;

  const [phase, setPhase] = useState<"idle" | "in" | "turn" | "open">("idle");
  const [finished, setFinished] = useState<Session | null>(null);
  const timeouts = useRef<number[]>([]);

  useEffect(() => () => timeouts.current.forEach((id) => window.clearTimeout(id)), []);

  const later = (ms: number, fn: () => void) => {
    timeouts.current.push(window.setTimeout(fn, ms));
  };

  const start = () => {
    const r: Run = {
      scheduleId: schedule.id,
      startedAt: Date.now(),
      stepIndex: 0,
      stepStartedAt: Date.now(),
      done: [],
    };
    update((s) => ({ ...s, run: r }));
  };

  const completeStep = () => {
    if (!run || phase !== "idle") return;
    const step = schedule.steps[run.stepIndex];
    const fast = calm ? 0.5 : 1;
    setPhase("in");
    sounds.click(sound);
    later(520 * fast, () => {
      setPhase("turn");
    });
    later(1000 * fast, () => {
      setPhase("open");
      sounds.unlock(sound);
    });
    later(2600 * fast, () => {
      const rec: SessionStep = {
        stepId: step.id,
        title: step.title,
        icon: step.icon,
        assist: null,
        secondsTaken: Math.max(1, Math.round((Date.now() - run.stepStartedAt) / 1000)),
      };
      const isLast = run.stepIndex + 1 >= schedule.steps.length;
      if (isLast) {
        const session: Session = {
          id: uid(),
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          startedAt: run.startedAt,
          finishedAt: Date.now(),
          steps: [...run.done, rec],
        };
        update((s) => ({ ...s, run: null, sessions: [session, ...s.sessions].slice(0, 200) }));
        setFinished(session);
        sounds.finish(sound);
      } else {
        update((s) => ({
          ...s,
          run: s.run && {
            ...s.run,
            stepIndex: s.run.stepIndex + 1,
            stepStartedAt: Date.now(),
            done: [...s.run.done, rec],
          },
        }));
      }
      setPhase("idle");
    });
  };

  const keyPhase: KeyPhase = phase === "in" ? "in" : phase === "turn" || phase === "open" ? "turn" : "away";
  const calmClass = calm ? "calm" : "";

  // ---------- final screen ----------
  if (finished) {
    const r = schedule.reward;
    return (
      <div className={`screen child ${calmClass}`}>
        <div className="topbar">
          <div className="spacer" />
          <HoldGear onDone={onOpenParent} hint={t("hold_hint")} />
        </div>
        <div className="finale">
          {!calm && <Sparkles />}
          <h1 className="finale-title">{t("all_done")}</h1>
          <p className="finale-sub">{t("all_done_sub")}</p>
          <Hallway schedule={schedule} current={schedule.steps.length} allDone />
          <div className="finale-reward">
            <div className="ft-tag">{t("then")}</div>
            <Pic icon={r.icon} photo={r.photo} className="finale-pic" />
            <div className="ft-title">{r.title}</div>
            {r.minutes ? (
              <div className="finale-minutes">
                {r.minutes} {t("min_short")}
              </div>
            ) : null}
          </div>
          <button type="button" className="big-btn" onClick={() => setFinished(null)}>
            {t("finish")}
          </button>
        </div>
      </div>
    );
  }

  // ---------- start screen ----------
  if (!run) {
    return (
      <div className={`screen child ${calmClass}`}>
        <div className="topbar">
          <FirstThen schedule={schedule} stepIndex={0} allDone={false} t={t} />
          <HoldGear onDone={onOpenParent} hint={t("hold_hint")} />
        </div>
        <div className="home">
          <h1 className="home-title">{schedule.name}</h1>
          <Hallway schedule={schedule} current={0} allDone={false} />
          <button type="button" className="big-btn big-btn-start" onClick={start}>
            <span className="btn-key">🗝️</span> {t("start")}
          </button>
          <p className="hint">{t("start_hint")}</p>
        </div>
      </div>
    );
  }

  // ---------- a step ----------
  const step = schedule.steps[run.stepIndex];
  const total = schedule.steps.length;
  return (
    <div className={`screen child ${calmClass}`}>
      <div className="topbar">
        <FirstThen schedule={schedule} stepIndex={run.stepIndex} allDone={false} t={t} />
        <HoldGear onDone={onOpenParent} hint={t("hold_hint")} />
      </div>

      <div className="stage" key={step.id}>
        <div className="stage-door">
          <div className="sign">
            <Pic icon={step.icon} photo={step.photo} className="sign-pic" />
            <span className="sign-count">
              {run.stepIndex + 1} {t("of")} {total}
            </span>
          </div>
          <Door
            open={phase === "open" ? 1 : 0}
            keyPhase={keyPhase}
            state="current"
            behindIcon={step.icon}
            behindPhoto={step.photo}
            num={run.stepIndex + 1}
            className="door-big"
          />
          {phase === "open" && !calm && <Sparkles />}
        </div>

        <div className="stage-side">
          {step.minutes ? (
            <TimerRing
              minutes={step.minutes}
              sound={sound}
              pauseLabel={t("pause")}
              resumeLabel={t("resume")}
              doneLabel={t("timer_done")}
            />
          ) : null}
          <button
            type="button"
            className="big-btn big-btn-done"
            onClick={completeStep}
            disabled={phase !== "idle"}
          >
            ✔ {t("done")}
          </button>
        </div>
      </div>

      <Hallway schedule={schedule} current={run.stepIndex} allDone={false} />
    </div>
  );
}
