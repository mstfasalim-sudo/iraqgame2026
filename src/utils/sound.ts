class StudioSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;

  // Background tension loop scheduler
  private musicTimerId: number | null = null;
  private musicStep = 0;
  private musicTier: 1 | 2 | 3 = 1;
  private musicActive = false;

  public setEnabled(val: boolean) {
    this.sfxEnabled = val;
  }

  public setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    if (!val) {
      this.stopStudioMusic();
    } else if (this.musicActive) {
      this.startLoop();
    }
  }

  public isEnabled(): boolean {
    return this.sfxEnabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  private getContext(allowMusicOnly = false): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!allowMusicOnly && !this.sfxEnabled) return null;
    if (allowMusicOnly && !this.musicEnabled) return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Warm pink-ish noise for realistic studio applause
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.18) * 1.4;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    slideTo?: number,
    allowMusicOnly = false
  ) {
    const ctx = this.getContext(allowMusicOnly);
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  /**
   * Crisp interactive UI click sound for buttons, navigation, and mode chips
   */
  public playClick() {
    this.playTone(620, 0.045, 'triangle', 0.065, 0, 740);
    this.playTone(930, 0.035, 'sine', 0.035, 0.015);
  }

  /**
   * Tactile option select sound
   */
  public playSelect() {
    this.playTone(480, 0.075, 'triangle', 0.085, 0, 560);
    this.playTone(720, 0.09, 'sine', 0.06, 0.035);
  }

  /**
   * Dramatic broadcast chime when a new question appears
   */
  public playQuestionIntro() {
    this.playTone(220, 0.25, 'sine', 0.09, 0);
    this.playTone(329.63, 0.28, 'triangle', 0.08, 0.06);
    this.playTone(440, 0.42, 'sine', 0.09, 0.12);
    this.playTone(659.25, 0.45, 'triangle', 0.06, 0.18);
  }

  /**
   * Suspenseful studio lock-in timpani pulse
   */
  public playLockIn() {
    this.playTone(164.81, 0.32, 'triangle', 0.13, 0, 196);
    this.playTone(246.94, 0.36, 'sine', 0.09, 0.06, 293.66);
    this.playTone(98, 0.48, 'sine', 0.12, 0.08);
  }

  /**
   * Synthesized warm studio audience applause (layered filtered handclaps + crowd wash)
   */
  public playApplause(durationSec = 1.9, intensity = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const buffer = this.getNoiseBuffer(ctx);
    const startTime = ctx.currentTime;

    // 1. Continuous soft crowd applause wash
    const washSource = ctx.createBufferSource();
    washSource.buffer = buffer;
    washSource.loop = true;

    const washFilter = ctx.createBiquadFilter();
    washFilter.type = 'bandpass';
    washFilter.frequency.setValueAtTime(1250, startTime);
    washFilter.Q.setValueAtTime(0.9, startTime);

    const washGain = ctx.createGain();
    washGain.gain.setValueAtTime(0.0001, startTime);
    washGain.gain.linearRampToValueAtTime(0.085 * intensity, startTime + 0.18);
    washGain.gain.setValueAtTime(0.08 * intensity, startTime + durationSec * 0.6);
    washGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    washSource.connect(washFilter);
    washFilter.connect(washGain);
    washGain.connect(ctx.destination);

    washSource.start(startTime);
    washSource.stop(startTime + durationSec + 0.05);

    // 2. Individual rhythmic audience handclap bursts
    const clapCount = Math.floor(22 * durationSec * Math.min(intensity, 1.3));
    for (let i = 0; i < clapCount; i++) {
      const t = startTime + Math.random() * (durationSec - 0.25);
      const progress = (t - startTime) / durationSec;
      const envScale =
        progress < 0.15
          ? progress / 0.15
          : progress > 0.65
            ? Math.max(0.1, (1 - progress) / 0.35)
            : 1;

      const clapSrc = ctx.createBufferSource();
      clapSrc.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950 + Math.random() * 1450, t);
      filter.Q.setValueAtTime(2.4 + Math.random() * 1.8, t);

      const gain = ctx.createGain();
      const peak = (0.045 + Math.random() * 0.045) * intensity * envScale;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065 + Math.random() * 0.04);

      clapSrc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      clapSrc.start(t, Math.random() * 0.8, 0.12);
    }
  }

  /**
   * Motivational correct-answer brass fanfare + warm audience applause
   */
  public playCorrect(isMilestone = false) {
    if (isMilestone) {
      const notes = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];
      notes.forEach((n, idx) => {
        this.playTone(n, 0.42, 'triangle', 0.12, idx * 0.07);
        this.playTone(n * 0.5, 0.42, 'sine', 0.06, idx * 0.07);
      });
      this.playApplause(2.6, 1.25);
    } else {
      this.playTone(523.25, 0.18, 'triangle', 0.12, 0);
      this.playTone(659.25, 0.22, 'triangle', 0.12, 0.08);
      this.playTone(783.99, 0.34, 'sine', 0.13, 0.16);
      this.playTone(1046.5, 0.38, 'triangle', 0.09, 0.24);
      this.playApplause(1.8, 0.95);
    }
  }

  /**
   * Millionaire grand prize orchestral fanfare + standing ovation applause
   */
  public playGrandVictory() {
    const fanfare = [
      { f: 523.25, d: 0.16, t: 0 },
      { f: 659.25, d: 0.16, t: 0.12 },
      { f: 783.99, d: 0.16, t: 0.24 },
      { f: 1046.5, d: 0.52, t: 0.36 },
      { f: 783.99, d: 0.18, t: 0.58 },
      { f: 1046.5, d: 0.85, t: 0.72 },
      { f: 1318.5, d: 0.9, t: 0.76 },
    ];
    fanfare.forEach((n) => {
      this.playTone(n.f, n.d, 'triangle', 0.14, n.t);
      this.playTone(n.f * 0.5, n.d, 'sine', 0.08, n.t);
    });
    this.playApplause(3.4, 1.35);
  }

  /**
   * Motivational ascending chime when reviving or advancing with momentum
   */
  public playMotivationalStinger() {
    this.playTone(440, 0.14, 'triangle', 0.1, 0);
    this.playTone(554.37, 0.14, 'triangle', 0.1, 0.08);
    this.playTone(659.25, 0.16, 'triangle', 0.11, 0.16);
    this.playTone(880, 0.32, 'sine', 0.12, 0.24);
  }

  /**
   * Classic dramatic wrong-answer horn + subtle crowd groan
   */
  public playWrong() {
    this.playTone(261.63, 0.3, 'sawtooth', 0.075, 0, 207.65);
    this.playTone(196, 0.62, 'triangle', 0.13, 0.16, 130.81);
    this.playTone(98, 0.7, 'sine', 0.11, 0.2, 82.41);
  }

  public playLifeline() {
    this.playTone(587.33, 0.11, 'sine', 0.09, 0);
    this.playTone(880, 0.2, 'triangle', 0.1, 0.08);
    this.playTone(1174.66, 0.24, 'sine', 0.07, 0.16);
  }

  public playTick(urgent = false) {
    this.playTone(urgent ? 920 : 640, 0.045, 'triangle', urgent ? 0.075 : 0.035);
    if (urgent) {
      this.playTone(460, 0.05, 'sine', 0.04, 0.02);
    }
  }

  public playWithdraw() {
    this.playTone(440, 0.2, 'triangle', 0.1, 0);
    this.playTone(554.37, 0.22, 'triangle', 0.1, 0.12);
    this.playTone(659.25, 0.35, 'sine', 0.1, 0.24);
    this.playApplause(1.2, 0.65);
  }

  public playReward() {
    this.playTone(659.25, 0.12, 'triangle', 0.11, 0);
    this.playTone(880, 0.14, 'triangle', 0.12, 0.08);
    this.playTone(1046.5, 0.28, 'sine', 0.12, 0.17);
  }

  /**
   * Interactive Millionaire-style rhythmic studio background music
   * Scales subtle tension pulse by difficulty tier (1, 2, 3)
   */
  public startStudioMusic(tier: 1 | 2 | 3 = 1) {
    this.musicTier = tier;
    this.musicActive = true;
    if (!this.musicEnabled) return;
    this.startLoop();
  }

  public updateMusicTier(tier: 1 | 2 | 3) {
    if (this.musicTier === tier) return;
    this.musicTier = tier;
    if (this.musicActive && this.musicEnabled) {
      this.startLoop();
    }
  }

  private startLoop() {
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }

    const stepMs = this.musicTier === 1 ? 520 : this.musicTier === 2 ? 440 : 370;
    const patterns: Record<1 | 2 | 3, number[]> = {
      1: [110, 164.81, 130.81, 164.81, 110, 196, 146.83, 164.81],
      2: [123.47, 185, 146.83, 185, 123.47, 220, 164.81, 185],
      3: [130.81, 196, 155.56, 207.65, 130.81, 246.94, 174.61, 196],
    };

    this.musicTimerId = window.setInterval(() => {
      if (!this.musicEnabled || !this.musicActive) return;
      const notes = patterns[this.musicTier];
      const idx = this.musicStep % notes.length;
      const baseFreq = notes[idx];

      // Subtle low studio heartbeat bass
      if (idx % 2 === 0) {
        this.playTone(baseFreq * 0.5, 0.34, 'sine', 0.045, 0, undefined, true);
      }
      // Atmospheric arpeggio pulse
      this.playTone(baseFreq * 2, 0.22, 'triangle', 0.022, 0, undefined, true);

      // Soft shimmer on downbeat
      if (idx === 0) {
        this.playTone(baseFreq * 3, 0.45, 'sine', 0.016, 0.04, undefined, true);
      }

      this.musicStep += 1;
    }, stepMs);
  }

  public stopStudioMusic() {
    this.musicActive = false;
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
  }
}

export const soundEngine = new StudioSoundEngine();
