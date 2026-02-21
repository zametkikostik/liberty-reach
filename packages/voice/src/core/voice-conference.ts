/**
 * Voice Conference - Push-to-Talk Conference Management
 * 
 * Zello-like voice conference with instant push-to-talk functionality.
 */

import type { AudioConfig, AudioStats } from '../audio/audio-engine.js';
import type { TransportConfig } from '../network/voice-transport.js';
import type { ConferenceMember, ConferenceEvent, VoiceFrame } from '../types.js';

/**
 * Conference configuration
 */
export interface ConferenceConfig {
  conferenceId: string;
  maxMembers: number;
  audioConfig: AudioConfig;
  transportConfig: TransportConfig;
  enableVoiceActivity: boolean;
  enableRecording: boolean;
  talkTimeout: number; // Maximum talk time in seconds
  idleTimeout: number; // Disconnect after idle seconds
}

/**
 * Conference state
 */
export interface ConferenceState {
  conferenceId: string;
  members: ConferenceMember[];
  currentSpeaker: string | null;
  isSpeaking: boolean;
  isConnected: boolean;
  isMuted: boolean;
  talkTimeRemaining: number;
  connectionQuality: number;
  createdAt: number;
}

/**
 * VoiceConference - Manages push-to-talk conferences
 */
export class VoiceConference {
  private config: ConferenceConfig;
  private state: ConferenceState;
  private members: Map<string, ConferenceMember> = new Map();
  private eventHandlers: Map<string, Array<(event: ConferenceEvent) => void>> = new Map();
  private talkTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: ConferenceConfig) {
    this.config = config;
    this.state = {
      conferenceId: config.conferenceId,
      members: [],
      currentSpeaker: null,
      isSpeaking: false,
      isConnected: false,
      isMuted: false,
      talkTimeRemaining: config.talkTimeout,
      connectionQuality: 1,
      createdAt: Date.now(),
    };
  }

  /**
   * Connect to conference
   */
  async connect(memberId: string, memberName: string): Promise<void> {
    const member: ConferenceMember = {
      id: memberId,
      name: memberName,
      joinedAt: Date.now(),
      isSpeaking: false,
      isMuted: false,
      isModerator: false,
      connectionQuality: 1,
    };

    this.members.set(memberId, member);
    this.updateState();
    this.emitEvent({
      type: 'member_joined',
      memberId,
      memberName,
      timestamp: Date.now(),
    });

    this.resetIdleTimer();
  }

  /**
   * Disconnect from conference
   */
  async disconnect(memberId: string): Promise<void> {
    this.members.delete(memberId);
    this.updateState();
    this.emitEvent({
      type: 'member_left',
      memberId,
      timestamp: Date.now(),
    });
  }

  /**
   * Start talking (push-to-talk)
   */
  startTalking(memberId: string): boolean {
    if (!this.members.has(memberId)) {
      return false;
    }

    if (this.state.currentSpeaker !== null) {
      // Someone else is already talking
      return false;
    }

    const member = this.members.get(memberId)!;
    member.isSpeaking = true;
    
    this.state.currentSpeaker = memberId;
    this.state.isSpeaking = true;
    this.state.talkTimeRemaining = this.config.talkTimeout;
    
    this.startTalkTimer(memberId);
    this.updateState();
    
    this.emitEvent({
      type: 'talking_started',
      memberId,
      memberName: member.name,
      timestamp: Date.now(),
    });

    this.resetIdleTimer();
    return true;
  }

  /**
   * Stop talking
   */
  stopTalking(memberId: string): void {
    if (this.state.currentSpeaker !== memberId) {
      return;
    }

    const member = this.members.get(memberId)!;
    member.isSpeaking = false;
    
    if (this.talkTimer) {
      clearTimeout(this.talkTimer);
      this.talkTimer = null;
    }
    
    this.state.currentSpeaker = null;
    this.state.isSpeaking = false;
    this.state.talkTimeRemaining = this.config.talkTimeout;
    
    this.updateState();
    
    this.emitEvent({
      type: 'talking_stopped',
      memberId,
      memberName: member.name,
      timestamp: Date.now(),
    });
  }

  /**
   * Send voice frame
   */
  sendVoiceFrame(memberId: string, frame: VoiceFrame): void {
    if (this.state.currentSpeaker !== memberId) {
      return; // Only current speaker can send audio
    }

    // Broadcast to all other members
    for (const [otherId, member] of this.members.entries()) {
      if (otherId !== memberId && !member.isMuted) {
        this.emitToMember(otherId, {
          type: 'voice_frame',
          memberId,
          frame,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Mute/unmute member
   */
  toggleMute(memberId: string): void {
    const member = this.members.get(memberId);
    if (!member) return;

    member.isMuted = !member.isMuted;
    this.state.isMuted = memberId === this.getLocalMemberId() && member.isMuted;
    
    this.updateState();
    this.emitEvent({
      type: 'mute_toggled',
      memberId,
      isMuted: member.isMuted,
      timestamp: Date.now(),
    });
  }

  /**
   * Get conference state
   */
  getState(): ConferenceState {
    return { ...this.state };
  }

  /**
   * Get members list
   */
  getMembers(): ConferenceMember[] {
    return Array.from(this.members.values());
  }

  /**
   * Set event handler
   */
  on(event: string, handler: (event: ConferenceEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: (event: ConferenceEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private updateState(): void {
    this.state.members = Array.from(this.members.values());
  }

  private startTalkTimer(memberId: string): void {
    if (this.talkTimer) {
      clearTimeout(this.talkTimer);
    }

    this.talkTimer = setInterval(() => {
      this.state.talkTimeRemaining--;
      
      if (this.state.talkTimeRemaining <= 0) {
        this.stopTalking(memberId);
        this.emitEvent({
          type: 'talk_timeout',
          memberId,
          timestamp: Date.now(),
        });
      }
      
      this.updateState();
    }, 1000);
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.emitEvent({
        type: 'idle_timeout',
        timestamp: Date.now(),
      });
    }, this.config.idleTimeout * 1000);
  }

  private emitEvent(event: ConferenceEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  private emitToMember(memberId: string, event: ConferenceEvent): void {
    const handlers = this.eventHandlers.get('member_event');
    if (handlers) {
      for (const handler of handlers) {
        handler({ ...event, targetMemberId: memberId });
      }
    }
  }

  private getLocalMemberId(): string {
    // In production, track local member ID
    return 'local';
  }
}
