// Ember Kitchen — sound: everything is synthesized with WebAudio, no files.
// A chop thock, a sizzle, a serve ding, a fail buzz, and a small ember groove
// that loops under the shift. M toggles it all.

export function makeAudio() {
  return { ctx: null, muted: false, musicTimer: null, musicStep: 0 };
}

function ensureCtx(audio) {
  if (!audio.ctx) {
    try { audio.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio.ctx = null; }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function tone(audio, freq, dur, type, vol, when = 0, slideTo = 0) {
  const ctx = ensureCtx(audio);
  if (!ctx || audio.muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(audio, dur, vol, filterFreq) {
  const ctx = ensureCtx(audio);
  if (!ctx || audio.muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

export function playSound(audio, name) {
  if (!audio || audio.muted) return;
  switch (name) {
    case 'pickup': tone(audio, 520, 0.08, 'sine', 0.18, 0, 760); break;
    case 'place': tone(audio, 340, 0.08, 'sine', 0.16, 0, 260); break;
    case 'start-cook': noise(audio, 0.35, 0.22, 3200); tone(audio, 220, 0.12, 'triangle', 0.12); break;
    case 'collect': tone(audio, 660, 0.09, 'sine', 0.2, 0, 990); break;
    case 'plate': tone(audio, 440, 0.07, 'triangle', 0.16); tone(audio, 660, 0.09, 'triangle', 0.16, 0.07); break;
    case 'serve': tone(audio, 880, 0.12, 'sine', 0.22); tone(audio, 1174, 0.2, 'sine', 0.22, 0.1); tone(audio, 1568, 0.25, 'sine', 0.14, 0.2); break;
    case 'serve-fail': tone(audio, 180, 0.3, 'sawtooth', 0.16, 0, 110); break;
    case 'trash': noise(audio, 0.2, 0.18, 700); break;
    case 'no': tone(audio, 140, 0.08, 'square', 0.08); break;
    case 'burnt': tone(audio, 300, 0.25, 'sawtooth', 0.14, 0, 90); noise(audio, 0.3, 0.12, 500); break;
    case 'timeout': tone(audio, 220, 0.4, 'sawtooth', 0.16, 0, 130); break;
    case 'click': tone(audio, 700, 0.05, 'sine', 0.12); break;
    case 'shift-end': [523, 659, 784, 1046].forEach((f, i) => tone(audio, f, 0.22, 'triangle', 0.18, i * 0.13)); break;
    default: break;
  }
}

// A tiny ember groove: low root notes with a bright pluck on top, one bar loop.
const BASS = [110, 110, 130.8, 98];
const PLUCK = [440, 523.25, 659.25, 523.25, 587.33, 523.25, 440, 392];
export function startMusic(audio) {
  if (!audio || audio.musicTimer) return;
  audio.musicTimer = setInterval(() => {
    if (audio.muted) return;
    const step = audio.musicStep % 8;
    const bar = Math.floor(audio.musicStep / 8) % 4;
    tone(audio, BASS[bar], 0.5, 'triangle', 0.07);
    if (step % 2 === 0) tone(audio, PLUCK[step], 0.22, 'sine', 0.05);
    audio.musicStep += 1;
  }, 260);
}

export function stopMusic(audio) {
  if (audio && audio.musicTimer) { clearInterval(audio.musicTimer); audio.musicTimer = null; }
}
