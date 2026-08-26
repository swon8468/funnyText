import type { SoundEffectId } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Super dramatic accelerating Drum Roll + Synth Riser
 */
export function playDrumRoll(durationMs: number = 700): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const durSec = durationMs / 1000;

  // 1. Snare Noise Riser
  const bufferSize = ctx.sampleRate * durSec;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.153852;
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.2;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + durSec);
  filter.Q.setValueAtTime(4, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + durSec * 0.92);
  gain.gain.linearRampToValueAtTime(0.01, now + durSec);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noiseNode.start(now);
  noiseNode.stop(now + durSec);

  // 2. High-speed accelerating tom machine gun
  const tapCount = 18;
  for (let i = 0; i < tapCount; i++) {
    const progress = i / tapCount;
    // Exponential time curve so tempo accelerates frantically
    const tapTime = now + Math.pow(progress, 1.4) * durSec;
    const osc = ctx.createOscillator();
    const tapGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150 + progress * 60, tapTime);
    osc.frequency.exponentialRampToValueAtTime(45, tapTime + 0.035);

    const volume = 0.1 + progress * 0.35;
    tapGain.gain.setValueAtTime(volume, tapTime);
    tapGain.gain.exponentialRampToValueAtTime(0.001, tapTime + 0.035);

    osc.connect(tapGain);
    tapGain.connect(ctx.destination);

    osc.start(tapTime);
    osc.stop(tapTime + 0.04);
  }

  // 3. Tension Riser Pitch Sweep
  const riser = ctx.createOscillator();
  const riserGain = ctx.createGain();
  riser.type = 'sawtooth';
  riser.frequency.setValueAtTime(110, now);
  riser.frequency.exponentialRampToValueAtTime(880, now + durSec);

  riserGain.gain.setValueAtTime(0.02, now);
  riserGain.gain.exponentialRampToValueAtTime(0.2, now + durSec * 0.95);
  riserGain.gain.linearRampToValueAtTime(0.001, now + durSec);

  riser.connect(riserGain);
  riserGain.connect(ctx.destination);

  riser.start(now);
  riser.stop(now + durSec);
}

/**
 * Super Snappy Cork / Explosion Pop
 */
export function playBoxPop(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Pop body
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.16);

  // Air blast noise
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
  }
  noise.buffer = buffer;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.4, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  noise.connect(nGain);
  nGain.connect(ctx.destination);

  noise.start(now);
}

/**
 * EARTH-SHAKING 808 Meme Boom (Massive Bass Drop + Distortion + Air Impact)
 */
export function playBoom(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Initial explosive crack
  playBoxPop();

  // 2. Heavy Sub Bass 808 Drop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const waveshaper = ctx.createWaveShaper();

  // Soft clipping curve for gritty distorted punch
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  const k = 40;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  waveshaper.curve = curve;
  waveshaper.oversample = '4x';

  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(26, now + 1.4);

  gain.gain.setValueAtTime(1.0, now);
  gain.gain.exponentialRampToValueAtTime(0.7, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

  osc.connect(waveshaper);
  waveshaper.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.7);

  // 3. Low rumble sub layer
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'triangle';
  sub.frequency.setValueAtTime(55, now + 0.05);
  sub.frequency.exponentialRampToValueAtTime(22, now + 1.8);

  subGain.gain.setValueAtTime(0.6, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  sub.connect(subGain);
  subGain.connect(ctx.destination);

  sub.start(now + 0.05);
  sub.stop(now + 1.9);
}

/**
 * Grand Victory Orchestral Brass Fanfare
 */
export function playFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playBoxPop();

  // Chords: G4 -> C5 -> E5 -> G5 -> High C6 (Power Triumph)
  const notes = [
    { freq: 392.0, time: 0.0, dur: 0.12 },     // G4
    { freq: 523.25, time: 0.1, dur: 0.12 },    // C5
    { freq: 659.25, time: 0.2, dur: 0.14 },    // E5
    { freq: 783.99, time: 0.32, dur: 0.16 },   // G5
    { freq: 1046.5, time: 0.46, dur: 1.2 },    // C6 (Grand Finale)
    { freq: 1318.51, time: 0.46, dur: 1.2 },   // E6 (Harmony)
    { freq: 1567.98, time: 0.46, dur: 1.2 },   // G6 (High shimmer)
  ];

  notes.forEach(({ freq, time, dur }) => {
    const startTime = now + time;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.004, startTime); // Rich Detune

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 0.5, startTime); // Warm Sub octave

    const vol = freq > 1000 ? 0.2 : 0.25;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc1.stop(startTime + dur);
    osc2.start(startTime);
    osc2.stop(startTime + dur);
    osc3.start(startTime);
    osc3.stop(startTime + dur);
  });
}

/**
 * Super Sparkly Laser Tada
 */
export function playTada(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  playBoxPop();

  // Ascending laser zaps + massive chord
  const chords = [
    { freq: 523.25, dur: 0.22 },  // C5
    { freq: 659.25, dur: 0.22 },  // E5
    { freq: 783.99, dur: 0.24 },  // G5
    { freq: 1046.5, dur: 0.8 },   // C6
    { freq: 1318.5, dur: 0.8 },   // E6
    { freq: 2093.0, dur: 0.9 },   // C7
  ];

  chords.forEach(({ freq, dur }, idx) => {
    const startTime = now + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur);
  });

  // Magical chime cascade
  for (let i = 0; i < 8; i++) {
    const chimeTime = now + 0.35 + i * 0.05;
    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1200 + i * 200, chimeTime);

    cGain.gain.setValueAtTime(0.12, chimeTime);
    cGain.gain.exponentialRampToValueAtTime(0.001, chimeTime + 0.2);

    chime.connect(cGain);
    cGain.connect(ctx.destination);

    chime.start(chimeTime);
    chime.stop(chimeTime + 0.22);
  }
}

/**
 * UI Click Feedback
 */
export function playClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);
}

/**
 * Master sound trigger dispatcher
 */
export function triggerSoundEffect(soundId: SoundEffectId): void {
  switch (soundId) {
    case 'boom':
      playBoom();
      break;
    case 'fanfare':
      playFanfare();
      break;
    case 'tada':
      playTada();
      break;
    case 'drumroll':
      playDrumRoll(600);
      setTimeout(() => playBoom(), 600);
      break;
    default:
      playBoom();
  }
}
