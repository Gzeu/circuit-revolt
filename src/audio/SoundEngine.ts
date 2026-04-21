export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private audioContext: AudioContext | null = null;
  private unlocked = false;

  static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private constructor() {}

  unlock(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.unlocked = true;
      }).catch(() => {
        // Silent fail - game continues without audio
      });
    } else {
      this.unlocked = true;
    }
  }

  private createOscillator(frequency: number, duration: number, gain: number, type: OscillatorType = 'sine'): void {
    if (!this.unlocked || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(gain, this.audioContext.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch {
      // Silent fail - game continues without audio
    }
  }

  private createNoiseBurst(duration: number, gain: number, filterFreq: number): void {
    if (!this.unlocked || !this.audioContext) return;

    try {
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * gain;
      }
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(this.audioContext.currentTime);
    } catch {
      // Silent fail - game continues without audio
    }
  }

  playPulse(): void {
    this.createOscillator(440, 0.08, 0.15);
  }

  playShutdown(): void {
    if (!this.unlocked || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, this.audioContext.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.6);
    } catch {
      // Silent fail - game continues without audio
    }
  }

  playWarning(): void {
    const playKlaxon = () => {
      this.createOscillator(520, 0.08, 0.12);
      setTimeout(() => this.createOscillator(380, 0.08, 0.12), 80);
    };
    
    playKlaxon();
    setTimeout(playKlaxon, 160);
  }

  playFloorClear(): void {
    this.createOscillator(440, 0.12, 0.14);
    setTimeout(() => this.createOscillator(554, 0.12, 0.14), 120);
    setTimeout(() => this.createOscillator(659, 0.12, 0.14), 240);
  }

  playHit(): void {
    this.createNoiseBurst(0.04, 0.2, 800);
  }
}
