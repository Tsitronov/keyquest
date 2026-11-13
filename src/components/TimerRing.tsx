import { useEffect, useRef, useState } from "react";
import { sounds } from "../audio";

interface Props {
  minutes: number;
  sound: boolean;
  pauseLabel: string;
  resumeLabel: string;
  doneLabel: string;
}

const R = 44;
const C = 2 * Math.PI * R;

/**
 * A shrinking ring. It never forces anything: when it reaches zero it plays one
 * soft note and stays calm. Tap to pause or resume.
 */
export function TimerRing({ minutes, sound, pauseLabel, resumeLabel, doneLabel }: Props) {
  const total = Math.max(1, Math.round(minutes * 60));
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const chimed = useRef(false);

  useEffect(() => {
    if (paused) return;
    const started = Date.now() - elapsed * 1000;
    const id = window.setInterval(() => {
      setElapsed(Math.min(total, (Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
    // elapsed is deliberately read only when (re)starting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, total]);

  const left = Math.max(0, total - elapsed);
  const finished = left <= 0;

  useEffect(() => {
    if (finished && !chimed.current) {
      chimed.current = true;
      sounds.timer(sound);
    }
  }, [finished, sound]);

  const secsLeft = Math.ceil(left);
  const mm = Math.floor(secsLeft / 60);
  const ss = secsLeft % 60;
  const label = finished ? doneLabel : `${mm}:${ss.toString().padStart(2, "0")}`;
  const frac = left / total;

  return (
    <button
      type="button"
      className={`timer ${finished ? "timer-done" : ""} ${paused ? "timer-paused" : ""}`}
      onClick={() => !finished && setPaused((p) => !p)}
      aria-label={paused ? resumeLabel : pauseLabel}
    >
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R} className="timer-track" />
        <circle
          cx="50"
          cy="50"
          r={R}
          className="timer-bar"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="timer-label">{paused ? "⏸" : label}</span>
    </button>
  );
}
