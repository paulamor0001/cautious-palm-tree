// js/audio.js

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

function tone({ freq, duration, type = 'sine', gain = 0.12, attack = 0.005, release = 0.08 }) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gn = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ac.currentTime;
  gn.gain.setValueAtTime(0, now);
  gn.gain.linearRampToValueAtTime(gain, now + attack);
  gn.gain.linearRampToValueAtTime(0, now + attack + duration + release);
  osc.connect(gn).connect(ac.destination);
  osc.start(now);
  osc.stop(now + attack + duration + release + 0.02);
}

export const sfx = {
  correct() { tone({ freq: 660, duration: 0.05, type: 'triangle' }); },
  wrong()   { tone({ freq: 180, duration: 0.10, type: 'sine', gain: 0.08 }); },
  reveal()  { tone({ freq: 880, duration: 0.12, type: 'sine' });
              setTimeout(() => tone({ freq: 1320, duration: 0.18, type: 'sine' }), 90); },
  hatch()   { tone({ freq: 520, duration: 0.18, type: 'triangle' });
              setTimeout(() => tone({ freq: 780, duration: 0.22, type: 'triangle' }), 120); },
  fanfare() {
    [523, 659, 784].forEach((f, i) =>
      setTimeout(() => tone({ freq: f, duration: 0.18, type: 'triangle' }), i * 130));
  },
};
