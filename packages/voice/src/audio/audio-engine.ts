/**
 * Audio Engine - Web Audio API wrapper for voice conferencing
 */

/**
 * Audio configuration
 */
export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
}

/**
 * Audio statistics
 */
export interface AudioStats {
  inputLevel: number;
  outputLevel: number;
  clipping: boolean;
  muted: boolean;
}

/**
 * AudioEngine - Manages audio capture and playback
 */
export class AudioEngine {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isCapturing = false;
  private isPlaying = false;
  private _stats: AudioStats = {
    inputLevel: 0,
    outputLevel: 0,
    clipping: false,
    muted: false,
  };

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      voiceIsolation: true,
      ...config,
    };
  }

  /**
   * Initialize audio engine
   */
  async initialize(): Promise<void> {
    this.audioContext = new AudioContext({
      sampleRate: this.config.sampleRate,
    });
  }

  /**
   * Start audio capture
   */
  async startCapture(onAudioData?: (samples: Float32Array) => void): Promise<void> {
    if (this.isCapturing) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
          voiceIsolation: this.config.voiceIsolation,
        },
      });

      if (!this.audioContext) {
        await this.initialize();
      }

      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      // Create analyser for level monitoring
      this.analyserNode = this.audioContext!.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.sourceNode.connect(this.analyserNode);

      // Create processor for audio data
      if (onAudioData) {
        this.processorNode = this.audioContext!.createScriptProcessor(4096, 1, 1);
        this.analyserNode.connect(this.processorNode);
        
        this.processorNode.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          onAudioData(new Float32Array(input));
          this.updateInputLevel(input);
        };
      }

      this.isCapturing = true;
    } catch (error) {
      throw new Error(`Failed to start audio capture: ${error}`);
    }
  }

  /**
   * Stop audio capture
   */
  stopCapture(): void {
    if (!this.isCapturing) return;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.isCapturing = false;
    this._stats.inputLevel = 0;
  }

  /**
   * Start audio playback
   */
  async startPlayback(): Promise<void> {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      await this.initialize();
    }

    // Create gain node for output
    this.gainNode = this.audioContext!.createGain();
    this.gainNode.connect(this.audioContext!.destination);
    
    this.isPlaying = true;
  }

  /**
   * Stop audio playback
   */
  stopPlayback(): void {
    if (!this.isPlaying) return;

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.isPlaying = false;
  }

  /**
   * Play received audio samples
   */
  playSamples(samples: Float32Array): void {
    if (!this.isPlaying || !this.audioContext) return;

    const audioBuffer = this.audioContext.createBuffer(1, samples.length, this.config.sampleRate);
    audioBuffer.getChannelData(0).set(samples);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode!);
    source.start();
  }

  /**
   * Mute/unmute capture
   */
  setMuted(muted: boolean): void {
    this._stats.muted = muted;
    
    if (this.sourceNode && this.analyserNode) {
      if (muted) {
        this.sourceNode.disconnect(this.analyserNode);
      } else {
        this.sourceNode.connect(this.analyserNode);
      }
    }
  }

  /**
   * Set output volume
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get audio statistics
   */
  getStats(): AudioStats {
    return { ...this._stats };
  }

  /**
   * Close audio engine
   */
  async close(): Promise<void> {
    this.stopCapture();
    this.stopPlayback();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private updateInputLevel(samples: Float32Array): void {
    let sum = 0;
    let max = 0;
    
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.abs(samples[i]!);
      sum += sample;
      max = Math.max(max, sample);
    }
    
    const rms = Math.sqrt(sum / samples.length);
    this._stats.inputLevel = rms;
    this._stats.clipping = max > 0.99;
  }
}
