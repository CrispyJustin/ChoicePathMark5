const MUTE_KEY = "choicepath-muted";

let _muted: boolean = typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";

export function getMuted(): boolean {
  return _muted;
}

export function toggleMute(): boolean {
  _muted = !_muted;
  if (typeof window !== "undefined") {
    localStorage.setItem(MUTE_KEY, _muted ? "1" : "0");
  }
  return _muted;
}

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      _ctx = new Ctor();
    }
    return _ctx;
  } catch {
    return null;
  }
}

type NoteSpec = {
  freq: number;
  offset: number;
  dur: number;
  vol?: number;
  type?: OscillatorType;
};

function schedule(ctx: AudioContext, notes: NoteSpec[]) {
  const t = ctx.currentTime;
  for (const { freq, offset, dur, vol = 0.22, type = "sine" } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const s = t + offset;
    gain.gain.setValueAtTime(0, s);
    gain.gain.linearRampToValueAtTime(vol, s + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    osc.start(s);
    osc.stop(s + dur + 0.02);
  }
}

async function play(fn: (ctx: AudioContext) => void) {
  if (_muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume();
  fn(ctx);
}

/** Bright ascending chime — green choice */
export function playGreen() {
  play((ctx) =>
    schedule(ctx, [
      { freq: 523, offset: 0,    dur: 0.38 },          // C5
      { freq: 659, offset: 0.13, dur: 0.38 },          // E5
      { freq: 784, offset: 0.26, dur: 0.50, vol: 0.26 }, // G5
    ])
  );
}

/** Descending buzz — red choice */
export function playRed() {
  play((ctx) =>
    schedule(ctx, [
      { freq: 320, offset: 0,    dur: 0.22, vol: 0.18, type: "sawtooth" },
      { freq: 220, offset: 0.20, dur: 0.30, vol: 0.16, type: "sawtooth" },
    ])
  );
}

/** Triumphant fanfare — student reaches 10 */
export function playFanfare() {
  play((ctx) => {
    // Short lead-up run: G4 → C5 → E5 → long G5 + B5 harmony
    schedule(ctx, [
      { freq: 392, offset: 0,    dur: 0.18, vol: 0.18, type: "triangle" }, // G4
      { freq: 523, offset: 0.17, dur: 0.18, vol: 0.18, type: "triangle" }, // C5
      { freq: 659, offset: 0.34, dur: 0.18, vol: 0.18, type: "triangle" }, // E5
      { freq: 784, offset: 0.50, dur: 1.10, vol: 0.22, type: "triangle" }, // G5 — sustained
      { freq: 988, offset: 0.50, dur: 1.10, vol: 0.10, type: "triangle" }, // B5 — harmony
      { freq: 1047,offset: 0.50, dur: 1.10, vol: 0.08, type: "triangle" }, // C6 — top harmony
    ]);
  });
}
