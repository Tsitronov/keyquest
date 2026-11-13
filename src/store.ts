import { useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";
import { defaultContent } from "./i18n";
import type { AppState, Lang, Schedule } from "./types";

const LS_KEY = "keyquest.state.v1";

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const inTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function makeDefaultState(lang: Lang = "ru"): AppState {
  const c = defaultContent(lang);
  const icons = ["🪥", "👕", "🥣", "🎒"];
  const schedule: Schedule = {
    id: uid(),
    name: c.name,
    steps: c.steps.map((title, i) => ({ id: uid(), title, icon: icons[i] })),
    reward: { title: c.reward, icon: "📺", minutes: 10 },
  };
  return {
    v: 1,
    settings: { lang, pin: "0000", sound: true, calmMotion: false },
    schedules: [schedule],
    activeScheduleId: schedule.id,
    run: null,
    sessions: [],
    abc: [],
  };
}

/** Keeps old or hand-edited data from crashing the app. */
function normalize(raw: unknown): AppState {
  const base = makeDefaultState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  const schedules = Array.isArray(r.schedules) && r.schedules.length ? r.schedules : base.schedules;
  const active = schedules.some((s) => s.id === r.activeScheduleId)
    ? (r.activeScheduleId as string)
    : schedules[0].id;
  return {
    v: 1,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    schedules,
    activeScheduleId: active,
    run: r.run ?? null,
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    abc: Array.isArray(r.abc) ? r.abc : [],
  };
}

let state: AppState = makeDefaultState();
let loaded = false;
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

async function persist(s: AppState) {
  const json = JSON.stringify(s);
  try {
    if (inTauri()) await invoke("save_state", { json });
    else localStorage.setItem(LS_KEY, json);
  } catch (e) {
    console.error("save failed", e);
  }
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void persist(state), 250);
}

/** Flush right away, e.g. when the window is closing. */
export function flushSave() {
  window.clearTimeout(saveTimer);
  return persist(state);
}

export async function loadState(): Promise<void> {
  try {
    let text: string | null = null;
    if (inTauri()) text = await invoke<string | null>("load_state");
    else text = localStorage.getItem(LS_KEY);
    if (text) state = normalize(JSON.parse(text));
  } catch (e) {
    console.error("load failed", e);
  }
  loaded = true;
  listeners.forEach((l) => l());
}

export const isLoaded = () => loaded;

export function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  listeners.forEach((l) => l());
  scheduleSave();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

export function getState() {
  return state;
}

export function activeSchedule(s: AppState): Schedule {
  return s.schedules.find((x) => x.id === s.activeScheduleId) ?? s.schedules[0];
}
