import {
  createTickSound,
  createGearMeshSound,
  createClickSound,
  createErrorSound,
} from './soundSynth';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tickBuffer: AudioBuffer | null = null;
  private gearMeshBuffer: AudioBuffer | null = null;
  private clickBuffer: AudioBuffer | null = null;
  private errorBuffer: AudioBuffer | null = null;
  private volume: number = 0.5;
  private enabled: boolean = true;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    this.tickBuffer = createTickSound(this.ctx, 1.0);
    this.gearMeshBuffer = createGearMeshSound(this.ctx, 1.0);
    this.clickBuffer = createClickSound(this.ctx, 1.0);
    this.errorBuffer = createErrorSound(this.ctx, 1.0);

    this.initialized = true;
  }

  playTick(): void {
    if (this.tickBuffer) {
      this.playBuffer(this.tickBuffer);
    }
  }

  playGearMesh(): void {
    if (this.gearMeshBuffer) {
      this.playBuffer(this.gearMeshBuffer);
    }
  }

  playClick(): void {
    if (this.clickBuffer) {
      this.playBuffer(this.clickBuffer);
    }
  }

  playError(): void {
    if (this.errorBuffer) {
      this.playBuffer(this.errorBuffer);
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setEnabled(e: boolean): void {
    this.enabled = e;
  }

  private playBuffer(buffer: AudioBuffer): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
  }
}

export const audioEngine = new AudioEngine();
