/**
 * VoIP Client - Main VoIP functionality
 * 
 * Handles calls, internal numbers, and offline call handling.
 */

import type { CallState, CallRecord, PhoneNumber, ForwardingRule, Voicemail } from '../types.js';
import type { VoIPConfig } from './voip-types.js';

/**
 * VoIP Client configuration
 */
export interface VoIPConfig {
  /** SIP server URL */
  sipServer: string;
  /** WebSocket URL for signaling */
  wsUrl: string;
  /** Internal number */
  internalNumber?: string;
  /** Enable call recording */
  enableRecording: boolean;
  /** Enable voicemail */
  enableVoicemail: boolean;
  /** Voicemail greeting URL */
  voicemailGreeting?: string;
  /** Call forwarding rules */
  forwardingRules: ForwardingRule[];
  /** Offline mode - queue calls */
  offlineMode: boolean;
  /** ICE servers for WebRTC */
  iceServers: RTCIceServer[];
}

/**
 * Incoming call event
 */
export interface IncomingCall {
  callId: string;
  from: string;
  fromName?: string;
  to: string;
  timestamp: number;
  accept: () => Promise<void>;
  reject: () => Promise<void>;
  ignore: () => void;
}

/**
 * VoIPClient - Main VoIP class
 */
export class VoIPClient {
  private config: VoIPConfig;
  private state: CallState = 'IDLE';
  private currentCallId: string | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callRecords: CallRecord[] = [];
  private voicemails: Voicemail[] = [];
  private onIncomingCall: ((call: IncomingCall) => void) | null = null;
  private onStateChange: ((state: CallState) => void) | null = null;

  constructor(config: Partial<VoIPConfig> = {}) {
    this.config = {
      sipServer: 'sip.libertyreach.io',
      wsUrl: 'wss://sip.libertyreach.io/ws',
      enableRecording: false,
      enableVoicemail: true,
      forwardingRules: [],
      offlineMode: false,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      ...config,
    };
  }

  /**
   * Initialize VoIP client
   */
  async initialize(): Promise<void> {
    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.notifyStateChange();
    };

    // Get local media stream
    await this.getLocalStream();
  }

  /**
   * Register internal number
   */
  async registerNumber(internalNumber: string, password: string): Promise<void> {
    // Register with SIP server
    // In production, use SIP.js or similar
    this.config.internalNumber = internalNumber;
  }

  /**
   * Make a call
   */
  async call(destination: string): Promise<void> {
    if (this.state !== 'IDLE') {
      throw new Error('Already in a call');
    }

    this.state = 'DIALING';
    this.notifyStateChange();

    try {
      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection!.setLocalDescription(offer);

      // Send offer via SIP/WebSocket
      // In production, send to SIP server
      await this.sendCallRequest(destination, offer);

      this.currentCallId = `call-${Date.now()}`;
      this.state = 'RINGING';
      this.notifyStateChange();
    } catch (error) {
      this.state = 'IDLE';
      this.notifyStateChange();
      throw error;
    }
  }

  /**
   * Accept incoming call
   */
  async acceptCall(callId: string): Promise<void> {
    if (this.state !== 'RINGING') {
      throw new Error('No incoming call to accept');
    }

    try {
      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer via SIP/WebSocket
      await this.sendCallAnswer(callId, answer);

      this.state = 'IN_CALL';
      this.currentCallId = callId;
      this.notifyStateChange();
    } catch (error) {
      this.state = 'IDLE';
      this.notifyStateChange();
      throw error;
    }
  }

  /**
   * Reject incoming call
   */
  async rejectCall(callId: string): Promise<void> {
    await this.sendCallReject(callId);
    this.state = 'IDLE';
    this.currentCallId = null;
    this.notifyStateChange();
  }

  /**
   * End current call
   */
  async endCall(): Promise<void> {
    if (!this.currentCallId) return;

    await this.sendCallEnd(this.currentCallId);

    // Close peer connection
    this.peerConnection?.close();
    this.peerConnection = null;

    // Stop local stream
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;

    // Record call
    if (this.currentCallId) {
      this.recordCallEnd(this.currentCallId);
    }

    this.state = 'IDLE';
    this.currentCallId = null;
    this.notifyStateChange();
  }

  /**
   * Put call on hold
   */
  async holdCall(): Promise<void> {
    if (this.state !== 'IN_CALL') return;

    this.state = 'ON_HOLD';
    
    // Mute local audio
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = false;
    });

    this.notifyStateChange();
  }

  /**
   * Resume call from hold
   */
  async resumeCall(): Promise<void> {
    if (this.state !== 'ON_HOLD') return;

    this.state = 'IN_CALL';
    
    // Unmute local audio
    this.localStream?.getAudioTracks().forEach(track => {
      track.enabled = true;
    });

    this.notifyStateChange();
  }

  /**
   * Transfer call
   */
  async transferCall(targetNumber: string): Promise<void> {
    if (this.state !== 'IN_CALL' && this.state !== 'ON_HOLD') return;

    this.state = 'TRANSFERRING';
    this.notifyStateChange();

    // Send transfer request via SIP
    await this.sendTransferRequest(this.currentCallId!, targetNumber);
  }

  /**
   * Send DTMF tone
   */
  sendDTMF(tone: string): void {
    if (this.state !== 'IN_CALL') return;

    // Send DTMF via RTP or SIP INFO
    // In production, use proper DTMF sending
    console.log('Sending DTMF:', tone);
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }

    return false;
  }

  /**
   * Enable/disable speaker
   */
  toggleSpeaker(): void {
    // In production, use proper speaker selection API
    console.log('Toggling speaker');
  }

  /**
   * Get call history
   */
  getCallHistory(limit: number = 50): CallRecord[] {
    return this.callRecords.slice(0, limit);
  }

  /**
   * Get voicemails
   */
  getVoicemails(): Voicemail[] {
    return [...this.voicemails];
  }

  /**
   * Mark voicemail as read
   */
  markVoicemailRead(voicemailId: string): void {
    const voicemail = this.voicemails.find(v => v.id === voicemailId);
    if (voicemail) {
      voicemail.isRead = true;
    }
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
   * Set call forwarding
   */
  setForwarding(rule: ForwardingRule): void {
    const existingIndex = this.config.forwardingRules.findIndex(r => r.id === rule.id);
    if (existingIndex !== -1) {
      this.config.forwardingRules[existingIndex] = rule;
    } else {
      this.config.forwardingRules.push(rule);
    }
  }

  /**
   * Disable call forwarding
   */
  disableForwarding(ruleId: string): void {
    const rule = this.config.forwardingRules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return this.state;
  }

  /**
   * Get current call ID
   */
  getCurrentCallId(): string | null {
    return this.currentCallId;
  }

  /**
   * Set incoming call handler
   */
  onIncomingCall(handler: (call: IncomingCall) => void): void {
    this.onIncomingCall = handler;
  }

  /**
   * Set state change handler
   */
  onStateChanged(handler: (state: CallState) => void): void {
    this.onStateChange = handler;
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private async getLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  private async sendCallRequest(destination: string, offer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send via SIP or WebSocket
    console.log('Sending call request to:', destination);
  }

  private async sendCallAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send via SIP or WebSocket
    console.log('Sending call answer:', callId);
  }

  private async sendCallReject(callId: string): Promise<void> {
    console.log('Rejecting call:', callId);
  }

  private async sendCallEnd(callId: string): Promise<void> {
    console.log('Ending call:', callId);
  }

  private async sendTransferRequest(callId: string, targetNumber: string): Promise<void> {
    console.log('Transferring call:', callId, 'to', targetNumber);
  }

  private recordCallEnd(callId: string): void {
    const record: CallRecord = {
      id: `record-${Date.now()}`,
      callId,
      from: '',
      to: '',
      direction: 'outbound',
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
    };

    this.callRecords.unshift(record);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
}
