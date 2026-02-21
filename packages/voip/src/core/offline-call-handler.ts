/**
 * Offline Call Handler
 * 
 * Handles calls when user is offline or in area with no signal.
 * Implements call queuing, voicemail, and callback scheduling.
 */

import type { Voicemail } from '../types.js';

/**
 * Offline call handler configuration
 */
export interface OfflineCallConfig {
  /** Enable voicemail */
  enableVoicemail: boolean;
  /** Voicemail max duration (seconds) */
  voicemailMaxDuration: number;
  /** Enable call queuing */
  enableQueuing: boolean;
  /** Max queue size */
  maxQueueSize: number;
  /** Enable callback scheduling */
  enableCallback: boolean;
  /** Enable SMS notification */
  enableSmsNotification: boolean;
  /** Enable push notification */
  enablePushNotification: boolean;
}

/**
 * Queued call
 */
interface QueuedCall {
  callId: string;
  from: string;
  fromName?: string;
  timestamp: number;
  type: 'voicemail' | 'callback_request' | 'missed';
  priority: 'normal' | 'high' | 'urgent';
  message?: string;
  audioUrl?: string;
  notified: boolean;
}

/**
 * OfflineCallHandler - Manages calls when user is unavailable
 */
export class OfflineCallHandler {
  private config: OfflineCallConfig;
  private queuedCalls: QueuedCall[] = [];
  private voicemails: Voicemail[] = [];
  private onNewVoicemail: ((voicemail: Voicemail) => void) | null = null;
  private onMissedCall: ((call: QueuedCall) => void) | null = null;

  constructor(config: Partial<OfflineCallConfig> = {}) {
    this.config = {
      enableVoicemail: true,
      voicemailMaxDuration: 300, // 5 minutes
      enableQueuing: true,
      maxQueueSize: 100,
      enableCallback: true,
      enableSmsNotification: true,
      enablePushNotification: true,
      ...config,
    };
  }

  /**
   * Handle incoming call when user is offline
   */
  async handleOfflineCall(
    callId: string,
    from: string,
    fromName?: string,
    reason: 'offline' | 'unavailable' | 'busy' | 'no_answer' = 'offline'
  ): Promise<void> {
    // Check forwarding rules first
    const forwarded = await this.checkForwarding(from);
    if (forwarded) return;

    // Add to queue
    const queuedCall: QueuedCall = {
      callId,
      from,
      fromName,
      timestamp: Date.now(),
      type: 'missed',
      priority: this.determinePriority(from),
      notified: false,
    };

    if (this.config.enableQueuing) {
      this.addToQueue(queuedCall);
    }

    // Send notifications
    await this.sendNotifications(queuedCall, reason);

    // Notify handlers
    if (this.onMissedCall) {
      this.onMissedCall(queuedCall);
    }
  }

  /**
   * Record voicemail
   */
  async recordVoicemail(
    callId: string,
    from: string,
    fromName: string | undefined,
    audioStream: MediaStream
  ): Promise<Voicemail> {
    if (!this.config.enableVoicemail) {
      throw new Error('Voicemail is disabled');
    }

    // Record audio
    const audioUrl = await this.recordAudio(audioStream);
    const duration = await this.getAudioDuration(audioUrl);

    // Transcribe (in production, use speech-to-text API)
    const transcript = await this.transcribeVoicemail(audioUrl);

    const voicemail: Voicemail = {
      id: `vm-${Date.now()}`,
      callId,
      fromNumber: from,
      fromName,
      duration,
      audioUrl,
      transcript,
      isRead: false,
      isSaved: false,
      createdAt: Date.now(),
    };

    this.voicemails.push(voicemail);

    // Add to queue
    const queuedCall: QueuedCall = {
      callId,
      from,
      fromName,
      timestamp: Date.now(),
      type: 'voicemail',
      priority: this.determinePriority(from),
      notified: false,
    };

    if (this.config.enableQueuing) {
      this.addToQueue(queuedCall);
    }

    // Send notifications
    await this.sendVoicemailNotification(voicemail);

    // Notify handlers
    if (this.onNewVoicemail) {
      this.onNewVoicemail(voicemail);
    }

    return voicemail;
  }

  /**
   * Request callback
   */
  async requestCallback(
    from: string,
    preferredTime?: number,
    message?: string
  ): Promise<void> {
    if (!this.config.enableCallback) {
      throw new Error('Callback is disabled');
    }

    const queuedCall: QueuedCall = {
      callId: `callback-${Date.now()}`,
      from,
      timestamp: Date.now(),
      type: 'callback_request',
      priority: preferredTime ? 'high' : 'normal',
      message,
      notified: false,
    };

    this.addToQueue(queuedCall);

    // Schedule callback
    if (preferredTime) {
      this.scheduleCallback(queuedCall, preferredTime);
    }
  }

  /**
   * Get queued calls
   */
  getQueuedCalls(): QueuedCall[] {
    return [...this.queuedCalls].sort((a, b) => {
      // Sort by priority and timestamp
      const priorityOrder = { urgent: 3, high: 2, normal: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    });
  }

  /**
   * Get voicemails
   */
  getVoicemails(): Voicemail[] {
    return [...this.voicemails];
  }

  /**
   * Mark call as handled
   */
  markCallHandled(callId: string): boolean {
    const index = this.queuedCalls.findIndex(c => c.callId === callId);
    if (index !== -1) {
      this.queuedCalls.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Mark voicemail as read
   */
  markVoicemailRead(voicemailId: string): boolean {
    const voicemail = this.voicemails.find(v => v.id === voicemailId);
    if (voicemail) {
      voicemail.isRead = true;
      return true;
    }
    return false;
  }

  /**
   * Delete voicemail
   */
  deleteVoicemail(voicemailId: string): boolean {
    const index = this.voicemails.findIndex(v => v.id === voicemailId);
    if (index !== -1) {
      this.voicemails.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get unread count
   */
  getUnreadCount(): { missedCalls: number; voicemails: number } {
    return {
      missedCalls: this.queuedCalls.filter(c => c.type === 'missed' && !c.notified).length,
      voicemails: this.voicemails.filter(v => !v.isRead).length,
    };
  }

  /**
   * Set new voicemail handler
   */
  onNewVoicemailHandler(handler: (voicemail: Voicemail) => void): void {
    this.onNewVoicemail = handler;
  }

  /**
   * Set missed call handler
   */
  onMissedCallHandler(handler: (call: QueuedCall) => void): void {
    this.onMissedCall = handler;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private async checkForwarding(from: string): Promise<boolean> {
    // In production, check forwarding rules and forward call
    return false;
  }

  private determinePriority(from: string): 'normal' | 'high' | 'urgent' {
    // In production, determine priority based on contact list, history, etc.
    return 'normal';
  }

  private addToQueue(call: QueuedCall): void {
    if (this.queuedCalls.length >= this.config.maxQueueSize) {
      // Remove oldest call
      this.queuedCalls.shift();
    }
    this.queuedCalls.push(call);
  }

  private async sendNotifications(call: QueuedCall, reason: string): Promise<void> {
    // Send push notification
    if (this.config.enablePushNotification) {
      await this.sendPushNotification({
        title: 'Missed Call',
        body: `${call.fromName || call.from} called while you were ${reason}`,
        data: { callId: call.callId, type: 'missed_call' },
      });
    }

    // Send SMS notification
    if (this.config.enableSmsNotification) {
      await this.sendSmsNotification(
        `Missed call from ${call.fromName || call.from} at ${new Date(call.timestamp).toLocaleString()}`
      );
    }
  }

  private async sendVoicemailNotification(voicemail: Voicemail): Promise<void> {
    if (this.config.enablePushNotification) {
      await this.sendPushNotification({
        title: 'New Voicemail',
        body: `From ${voicemail.fromName || voicemail.fromNumber} - ${voicemail.duration}s`,
        data: { voicemailId: voicemail.id, type: 'voicemail' },
      });
    }

    if (this.config.enableSmsNotification) {
      await this.sendSmsNotification(
        `New voicemail from ${voicemail.fromName || voicemail.fromNumber} (${voicemail.duration}s)`
      );
    }
  }

  private async sendPushNotification(notification: {
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<void> {
    // In production, use Push API or native push service
    console.log('Push notification:', notification);
  }

  private async sendSmsNotification(message: string): Promise<void> {
    // In production, use SMS gateway
    console.log('SMS notification:', message);
  }

  private async recordAudio(stream: MediaStream): Promise<string> {
    // Record audio from stream
    // In production, use MediaRecorder API
    return 'audio-url-placeholder';
  }

  private async getAudioDuration(audioUrl: string): Promise<number> {
    // Get audio duration
    // In production, analyze audio file
    return 30;
  }

  private async transcribeVoicemail(audioUrl: string): Promise<string> {
    // Transcribe voicemail to text
    // In production, use speech-to-text API
    return '[Voicemail transcript]';
  }

  private scheduleCallback(call: QueuedCall, preferredTime: number): void {
    const delay = preferredTime - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        // Trigger callback
        console.log('Scheduled callback:', call.from);
      }, delay);
    }
  }
}
