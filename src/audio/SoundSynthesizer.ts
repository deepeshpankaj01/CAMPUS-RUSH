/**
 * Deepesh Dash: Campus Rush - Procedural Web Audio Synthesizer
 * 100% Offline, Zero external assets, Zero latency.
 */

export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public musicVolume: number = 0.5;
  public sfxVolume: number = 0.7;
  public musicMuted: boolean = false;
  public sfxMuted: boolean = false;

  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private currentStep: number = 0;
  private isFocusMode: boolean = false;
  private tempoBpm: number = 126;

  constructor() {
    this.loadSettings();
  }

  public init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private loadSettings(): void {
    try {
      const savedMusicVol = localStorage.getItem('dd_music_vol');
      const savedSfxVol = localStorage.getItem('dd_sfx_vol');
      const savedMusicMute = localStorage.getItem('dd_music_mute');
      const savedSfxMute = localStorage.getItem('dd_sfx_mute');

      if (savedMusicVol !== null) this.musicVolume = parseFloat(savedMusicVol);
      if (savedSfxVol !== null) this.sfxVolume = parseFloat(savedSfxVol);
      if (savedMusicMute !== null) this.musicMuted = savedMusicMute === 'true';
      if (savedSfxMute !== null) this.sfxMuted = savedSfxMute === 'true';
    } catch {
      // Ignore storage errors
    }
  }

  public saveSettings(): void {
    try {
      localStorage.setItem('dd_music_vol', this.musicVolume.toString());
      localStorage.setItem('dd_sfx_vol', this.sfxVolume.toString());
      localStorage.setItem('dd_music_mute', this.musicMuted.toString());
      localStorage.setItem('dd_sfx_mute', this.sfxMuted.toString());
    } catch {
      // Ignore storage errors
    }
  }

  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    this.saveSettings();
  }

  public toggleMusicMute(): boolean {
    this.musicMuted = !this.musicMuted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    this.saveSettings();
    return this.musicMuted;
  }

  public toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
    this.saveSettings();
    return this.sfxMuted;
  }

  // ================= SFX IMPLEMENTATIONS =================

  public playCoin(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Bright ping arpeggio
    osc.frequency.setValueAtTime(1320, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.05);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playSpark(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    // Harmonized triad
    const freqs = [587.33, 739.99, 880.0, 1174.66]; // D major chord
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.35);

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.15, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.03);
      osc.stop(t + 0.45);
    });
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playSlide(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    // White noise friction burst
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playPowerUp(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C E G C E G
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.12, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.18);
    });
  }

  public playFocusModeStart(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;

    // Sub-bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.6);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.6);

    // Neon riser sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(220, t);
    sweep.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    sweepGain.gain.setValueAtTime(0.2, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(t);
    sweep.stop(t + 0.55);
  }

  public playShieldAbsorb(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playCollision(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;

    // Heavy impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Metallic crunch noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.4, t);
    noise.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);
  }

  public playMissionComplete(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [349.23, 440.0, 523.25, 698.46]; // F4, A4, C5, F5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);

      gain.gain.setValueAtTime(0.25, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.35);
    });
  }

  public playPersonalBest(): void {
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0]; // D major ascending
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.18, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  // ================= DYNAMIC BGM SYNTHESIZER =================

  public startMusic(): void {
    if (this.isMusicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;

    const stepDuration = (60 / this.tempoBpm) / 4; // 16th notes
    this.musicIntervalId = window.setInterval(() => {
      if (!this.isMusicPlaying || !this.ctx || this.musicMuted) return;
      this.playMusicStep(this.ctx.currentTime, this.currentStep);
      this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop
    }, stepDuration * 1000);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  public setFocusModeAudio(enabled: boolean): void {
    this.isFocusMode = enabled;
  }

  public setGameSpeed(speedMultiplier: number): void {
    // Dynamic tempo adjustment with speed (126 to 142 BPM)
    this.tempoBpm = Math.min(144, 126 + (speedMultiplier - 1.0) * 16);
  }

  private playMusicStep(t: number, step: number): void {
    if (!this.ctx || !this.musicGain) return;

    // Bar 0-15: Dm, Bar 16-31: F, Bar 32-47: C, Bar 48-63: G
    const rootFreqs = [73.42, 87.31, 65.41, 98.0]; // D2, F2, C2, G2
    const chordIndex = Math.floor(step / 16);
    const root = rootFreqs[chordIndex];

    // --- Kick on every 4th 16th-note (beats 1, 2, 3, 4) ---
    if (step % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(110, t);
      kick.frequency.exponentialRampToValueAtTime(32, t + 0.08);

      kickGain.gain.setValueAtTime(0.35, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      kick.connect(kickGain);
      kickGain.connect(this.musicGain);
      kick.start(t);
      kick.stop(t + 0.12);
    }

    // --- Snare on beats 2 and 4 (step 4, 12) ---
    if (step % 8 === 4) {
      const snareNoise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.09, this.ctx.sampleRate);
      const data = snareNoise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = snareNoise;

      const snareFilter = this.ctx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(1200, t);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.18, t);
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      noiseSource.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(this.musicGain);
      noiseSource.start(t);
    }

    // --- Hi-Hat on offbeats ---
    if (step % 2 === 1) {
      const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.035, this.ctx.sampleRate);
      const data = hatBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const hat = this.ctx.createBufferSource();
      hat.buffer = hatBuffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7500, t);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.08, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);
      hat.start(t);
    }

    // --- Driving Bassline on 8th notes ---
    if (step % 2 === 0) {
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';

      // Bass octave bounce
      const noteFreq = step % 4 === 0 ? root : root * 2;
      bass.frequency.setValueAtTime(noteFreq, t);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(this.isFocusMode ? 900 : 450, t);

      bassGain.gain.setValueAtTime(0.2, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      bass.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bass.start(t);
      bass.stop(t + 0.12);
    }

    // --- Synth Arpeggiator Lead ---
    const arpScale = [1, 1.2, 1.5, 1.8, 2.0, 2.4]; // Minor pentatonic intervals
    const arpNote = arpScale[(step * 3) % arpScale.length];
    const leadOsc = this.ctx.createOscillator();
    const leadGain = this.ctx.createGain();

    leadOsc.type = this.isFocusMode ? 'sawtooth' : 'triangle';
    const leadFreq = root * 4 * arpNote;
    leadOsc.frequency.setValueAtTime(leadFreq, t);

    leadGain.gain.setValueAtTime(this.isFocusMode ? 0.12 : 0.06, t);
    leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    leadOsc.connect(leadGain);
    leadGain.connect(this.musicGain);
    leadOsc.start(t);
    leadOsc.stop(t + 0.08);
  }
}

export const soundManager = new SoundSynthesizer();
