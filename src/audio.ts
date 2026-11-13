// Tiny, quiet WebAudio sounds. No files, nothing sudden or shrill.
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, vol = 0.12, type: OscillatorType = "sine") {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sounds = {
  /** Key slides into the lock. */
  click(on: boolean) {
    if (!on) return;
    tone(520, 0, 0.09, 0.08, "triangle");
  },
  /** Lock turns and the door opens. */
  unlock(on: boolean) {
    if (!on) return;
    tone(392, 0, 0.18, 0.1);
    tone(523, 0.14, 0.3, 0.1);
  },
  /** All doors open. A calm rising arpeggio, once. */
  finish(on: boolean) {
    if (!on) return;
    [392, 494, 587, 784].forEach((f, i) => tone(f, i * 0.16, 0.5, 0.1));
  },
  /** Timer reached zero. Soft, single note. */
  timer(on: boolean) {
    if (!on) return;
    tone(440, 0, 0.7, 0.09);
  },
};
