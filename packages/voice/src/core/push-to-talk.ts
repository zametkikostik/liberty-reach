/**
 * Push-to-Talk Controller
 * 
 * Handles push-to-talk button behavior and state management.
 */

/**
 * PTT state
 */
export type PTState = 'IDLE' | 'PRESSED' | 'TRANSMITTING' | 'RELEASED';

/**
 * PTT configuration
 */
export interface PTTConfig {
  /** Minimum press duration to transmit (ms) */
  minPressDuration: number;
  /** Debounce time between presses (ms) */
  debounceTime: number;
  /** Enable voice activity detection */
  enableVAD: boolean;
  /** Haptic feedback on press */
  hapticFeedback: boolean;
  /** Sound feedback */
  soundFeedback: boolean;
}

/**
 * PushToTalk - Manages PTT button behavior
 */
export class PushToTalk {
  private config: PTTConfig;
  private state: PTState = 'IDLE';
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private onStateChange: ((state: PTState) => void) | null = null;
  private onStartTransmit: (() => void) | null = null;
  private onStopTransmit: (() => void) | null = null;

  constructor(config: Partial<PTTConfig> = {}) {
    this.config = {
      minPressDuration: 100,
      debounceTime: 200,
      enableVAD: true,
      hapticFeedback: true,
      soundFeedback: true,
      ...config,
    };
  }

  /**
   * Set state change handler
   */
  onStateChanged(handler: (state: PTState) => void): void {
    this.onStateChange = handler;
  }

  /**
   * Set transmit start handler
   */
  onTransmitStart(handler: () => void): void {
    this.onStartTransmit = handler;
  }

  /**
   * Set transmit stop handler
   */
  onTransmitStop(handler: () => void): void {
    this.onStopTransmit = handler;
  }

  /**
   * Handle PTT button press
   */
  press(): void {
    if (this.state !== 'IDLE') {
      return;
    }

    if (this.debounceTimer) {
      return; // Still in debounce
    }

    this.state = 'PRESSED';
    this.notifyStateChange();

    // Haptic feedback
    if (this.config.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Start transmit timer
    this.pressTimer = setTimeout(() => {
      if (this.state === 'PRESSED') {
        this.startTransmit();
      }
    }, this.config.minPressDuration);
  }

  /**
   * Handle PTT button release
   */
  release(): void {
    if (this.state === 'IDLE') {
      return;
    }

    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }

    if (this.state === 'PRESSED') {
      // Released before min duration
      this.state = 'IDLE';
      this.notifyStateChange();
      return;
    }

    if (this.state === 'TRANSMITTING') {
      this.state = 'RELEASED';
      this.notifyStateChange();
      this.stopTransmit();
    }

    // Start debounce
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.state === 'RELEASED') {
        this.state = 'IDLE';
        this.notifyStateChange();
      }
    }, this.config.debounceTime);
  }

  /**
   * Toggle PTT state
   */
  toggle(): void {
    if (this.state === 'IDLE' || this.state === 'RELEASED') {
      this.press();
    } else {
      this.release();
    }
  }

  /**
   * Get current state
   */
  getState(): PTState {
    return this.state;
  }

  /**
   * Check if currently transmitting
   */
  isTransmitting(): boolean {
    return this.state === 'TRANSMITTING';
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private startTransmit(): void {
    this.state = 'TRANSMITTING';
    this.notifyStateChange();

    if (this.config.soundFeedback) {
      this.playStartSound();
    }

    if (this.onStartTransmit) {
      this.onStartTransmit();
    }
  }

  private stopTransmit(): void {
    if (this.onStopTransmit) {
      this.onStopTransmit();
    }

    if (this.config.soundFeedback) {
      this.playEndSound();
    }

    setTimeout(() => {
      if (this.state === 'RELEASED') {
        this.state = 'IDLE';
        this.notifyStateChange();
      }
    }, 100);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private playStartSound(): void {
    // Play "go ahead" beep
    this.playTone(800, 100);
  }

  private playEndSound(): void {
    // Play "over" beep
    this.playTone(600, 150);
  }

  private playTone(frequency: number, duration: number): void {
    // Simple beep using Web Audio API
    if (typeof AudioContext === 'undefined') return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gain.gain.value = 0.1;

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  }
}
