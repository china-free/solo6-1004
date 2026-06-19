export function createTickSound(ctx: AudioContext, volume: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.05;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const frequency = 3000 + Math.random() * 2000;
  const attackSamples = Math.floor(sampleRate * 0.001);
  const decaySamples = length - attackSamples;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let envelope: number;

    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else {
      const decayT = (i - attackSamples) / decaySamples;
      envelope = Math.exp(-decayT * 60);
    }

    const highPass = Math.max(0, 1 - Math.exp(-(frequency - 2000) * t * 0.001));
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume * highPass;
  }

  return buffer;
}

export function createGearMeshSound(ctx: AudioContext, volume: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.01;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const centerFreq = 8000;
  const q = 5;
  const attackSamples = Math.floor(sampleRate * 0.0005);
  const releaseSamples = length - attackSamples;

  let lastOut = 0;

  for (let i = 0; i < length; i++) {
    const whiteNoise = Math.random() * 2 - 1;
    let envelope: number;

    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else {
      const releaseT = (i - attackSamples) / releaseSamples;
      envelope = Math.exp(-releaseT * 80);
    }

    const filtered = bandPassFilter(whiteNoise, centerFreq, q, sampleRate, lastOut);
    lastOut = filtered;
    data[i] = filtered * envelope * volume;
  }

  return buffer;
}

export function createClickSound(ctx: AudioContext, volume: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.02;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const freq1 = 1500;
  const freq2 = 800;
  const attackSamples = Math.floor(sampleRate * 0.0005);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let envelope: number;

    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else {
      const decayT = (i - attackSamples) / (length - attackSamples);
      envelope = Math.exp(-decayT * 15);
    }

    const freqSweep = freq1 + (freq2 - freq1) * (i / length);
    data[i] = Math.sin(2 * Math.PI * freqSweep * t) * envelope * volume * 0.8;
  }

  return buffer;
}

export function createErrorSound(ctx: AudioContext, volume: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.15;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const baseFreq = 200;
  const buzzFreq = 120;
  const attackSamples = Math.floor(sampleRate * 0.002);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let envelope: number;

    if (i < attackSamples) {
      envelope = i / attackSamples;
    } else {
      const decayT = (i - attackSamples) / (length - attackSamples);
      envelope = 1 - decayT;
    }

    const square = Math.sign(Math.sin(2 * Math.PI * baseFreq * t));
    const buzz = Math.sin(2 * Math.PI * buzzFreq * t) > 0 ? 1 : 0;
    data[i] = (square * 0.6 + buzz * 0.4) * envelope * volume * 0.7;
  }

  return buffer;
}

function bandPassFilter(
  input: number,
  centerFreq: number,
  q: number,
  sampleRate: number,
  lastOut: number
): number {
  const w0 = (2 * Math.PI * centerFreq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = alpha;
  const a0 = 1 + alpha;
  return (b0 * input + b0 * lastOut) / a0;
}
