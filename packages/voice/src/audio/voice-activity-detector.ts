/**
 * Voice Activity Detector
 * 
 * Detects speech in audio stream to optimize bandwidth.
 */

/**
 * VAD configuration
 */
export interface VADConfig {
  /** Silence threshold (0-1) */
  silenceThreshold: number;
  /** Minimum speech duration (ms) */
  minSpeechDuration: number;
  /** Minimum silence duration to stop (ms) */
  minSilenceDuration: number;
  /** Smoothing factor */
  smoothingFactor: number;
}

/**
 * VAD state
 */
export type VADState = 'SILENCE' | 'SPEECH_START' | 'SPEECH' | 'SPEECH_END';

/**
 * VoiceActivityDetector - Detects voice activity in audio
 */
export class VoiceActivityDetector {
  private config: VADConfig;
  private state: VADState = 'SILENCE';
  private smoothedLevel = 0;
  private speechStartTime = 0;
  private silenceStartTime = 0;
  private onStateChange: ((state: VADState) => void) | null = null;
  private onSpeechStart: (() => void) | null = null;
  private onSpeechEnd: (() => void) | null = null;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = {
      silenceThreshold: 0.02,
      minSpeechDuration: 50,
      minSilenceDuration: 200,
      smoothingFactor: 0.1,
      ...config,
    };
  }

  /**
   * Set state change handler
   */
  onStateChanged(handler: (state: VADState) => void): void {
    this.onStateChange = handler;
  }

  /**
   * Set speech start handler
   */
  onSpeech(handler: () => void): void {
    this.onSpeechStart = handler;
  }

  /**
   * Set speech end handler
   */
  onSilence(handler: () => void): void {
    this.onSpeechEnd = handler;
  }

  /**
   * Process audio samples
   */
  process(samples: Float32Array): void {
    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i]! * samples[i]!;
    }
    const rms = Math.sqrt(sum / samples.length);

    // Apply smoothing
    this.smoothedLevel = this.config.smoothingFactor * rms + 
                         (1 - this.config.smoothingFactor) * this.smoothedLevel;

    // State machine
    switch (this.state) {
      case 'SILENCE':
        if (this.smoothedLevel > this.config.silenceThreshold) {
          this.state = 'SPEECH_START';
          this.speechStartTime = Date.now();
          this.notifyStateChange();
        }
        break;

      case 'SPEECH_START':
        if (this.smoothedLevel <= this.config.silenceThreshold) {
          // False start
          this.state = 'SILENCE';
          this.notifyStateChange();
        } else if (Date.now() - this.speechStartTime >= this.config.minSpeechDuration) {
          this.state = 'SPEECH';
          this.notifyStateChange();
          if (this.onSpeechStart) {
            this.onSpeechStart();
          }
        }
        break;

      case 'SPEECH':
        if (this.smoothedLevel <= this.config.silenceThreshold) {
          this.silenceStartTime = Date.now();
          this.state = 'SPEECH_END';
          this.notifyStateChange();
        }
        break;

      case 'SPEECH_END':
        if (this.smoothedLevel > this.config.silenceThreshold) {
          // Speech resumed
          this.state = 'SPEECH';
          this.notifyStateChange();
        } else if (Date.now() - this.silenceStartTime >= this.config.minSilenceDuration) {
          this.state = 'SILENCE';
          this.notifyStateChange();
          if (this.onSpeechEnd) {
            this.onSpeechEnd();
          }
        }
        break;
    }
  }

  /**
   * Get current state
   */
  getState(): VADState {
    return this.state;
  }

  /**
   * Check if currently detecting speech
   */
  isSpeaking(): boolean {
    return this.state === 'SPEECH' || this.state === 'SPEECH_START';
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.state = 'SILENCE';
    this.smoothedLevel = 0;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
}
