/**
 * Video Client - WebRTC video calls
 */

import type { VideoCallState, VideoConfig } from './video-types.js';
import type { Participant, VideoStats, NetworkQuality } from '../types.js';

/**
 * Video configuration
 */
export interface VideoConfig {
  /** ICE servers */
  iceServers: RTCIceServer[];
  /** Enable video by default */
  enableVideo: boolean;
  /** Enable screen sharing */
  enableScreenSharing: boolean;
  /** Max video quality */
  maxQuality: 'low' | 'medium' | 'high' | 'ultra';
  /** Enable video processing */
  enableProcessing: boolean;
  /** Bandwidth limit (kbps) */
  bandwidthLimit: number;
}

/**
 * Video call state
 */
export type VideoCallState =
  | 'IDLE'
  | 'CONNECTING'
  | 'RINGING'
  | 'IN_CALL'
  | 'ENDED';

/**
 * VideoClient - WebRTC video calling
 */
export class VideoClient {
  private config: VideoConfig;
  private state: VideoCallState = 'IDLE';
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private participants: Map<string, Participant> = new Map();
  private dataChannel: RTCDataChannel | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<VideoConfig> = {}) {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      enableVideo: true,
      enableScreenSharing: true,
      maxQuality: 'high',
      enableProcessing: true,
      bandwidthLimit: 2000, // 2 Mbps
      ...config,
    };
  }

  /**
   * Initialize video client
   */
  async initialize(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peerConnection.ontrack = (event) => {
      this.handleRemoteTrack(event);
    };

    this.peerConnection.onicecandidate = (event) => {
      this.handleIceCandidate(event);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.handleConnectionStateChange();
    };

    // Create data channel for signaling
    this.dataChannel = this.peerConnection.createDataChannel('control');
    this.setupDataChannel();
  }

  /**
   * Start video call
   */
  async startCall(participantId: string): Promise<void> {
    this.state = 'CONNECTING';

    try {
      // Get local media
      await this.getLocalMedia();

      // Add tracks to peer connection
      this.localStream!.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection!.setLocalDescription(offer);

      // Send offer via signaling (in production, use signaling server)
      await this.sendOffer(participantId, offer);

      this.state = 'RINGING';
    } catch (error) {
      this.state = 'IDLE';
      throw error;
    }
  }

  /**
   * Accept incoming video call
   */
  async acceptCall(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Get local media
      await this.getLocalMedia();

      // Add tracks
      this.localStream!.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer
      await this.sendAnswer(answer);

      this.state = 'IN_CALL';
      this.startStatsCollection();
    } catch (error) {
      this.state = 'IDLE';
      throw error;
    }
  }

  /**
   * End call
   */
  async endCall(): Promise<void> {
    this.stopStatsCollection();

    // Close peer connection
    this.peerConnection?.close();
    this.peerConnection = null;

    // Stop local stream
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;

    this.remoteStreams.clear();
    this.participants.clear();
    this.state = 'IDLE';
  }

  /**
   * Toggle local video
   */
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle local audio
   */
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentLabel = videoTrack.label;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    if (videoDevices.length < 2) return;

    const currentIndex = videoDevices.findIndex(d => d.label === currentLabel);
    const nextIndex = (currentIndex + 1) % videoDevices.length;

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: videoDevices[nextIndex].deviceId },
    });

    const newTrack = newStream.getVideoTracks()[0];
    
    // Replace track in peer connection
    const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(newTrack);
    }

    // Update local stream
    this.localStream.removeTrack(videoTrack);
    videoTrack.stop();
    this.localStream.addTrack(newTrack);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    // Replace video track with screen share
    const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(screenTrack);
    }

    // Handle screen share stop
    screenTrack.onended = () => {
      this.stopScreenShare();
    };

    return screenStream;
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    
    const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(videoTrack);
    }
  }

  /**
   * Get local video stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream for participant
   */
  getRemoteStream(participantId: string): MediaStream | null {
    return this.remoteStreams.get(participantId) || null;
  }

  /**
   * Get all participants
   */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get call statistics
   */
  async getStats(): Promise<VideoStats> {
    if (!this.peerConnection) {
      throw new Error('Not in call');
    }

    const stats = await this.peerConnection.getStats();
    let videoStats: VideoStats = {
      resolution: { width: 0, height: 0 },
      framerate: 0,
      bitrate: 0,
      packetLoss: 0,
      jitter: 0,
      rtt: 0,
    };

    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        videoStats = {
          resolution: {
            width: report.frameWidth || 0,
            height: report.frameHeight || 0,
          },
          framerate: report.framesPerSecond || 0,
          bitrate: report.bytesReceived || 0,
          packetLoss: report.packetsLost || 0,
          jitter: report.jitter || 0,
          rtt: 0,
        };
      }
    });

    return videoStats;
  }

  /**
   * Get network quality
   */
  async getNetworkQuality(): Promise<NetworkQuality> {
    const stats = await this.getStats();
    
    let score = 5;
    let recommendation = 'Excellent';

    if (stats.packetLoss > 5 || stats.jitter > 50 || stats.rtt > 200) {
      score = 2;
      recommendation = 'Poor connection - reduce quality';
    } else if (stats.packetLoss > 2 || stats.jitter > 30 || stats.rtt > 100) {
      score = 3;
      recommendation = 'Fair connection';
    } else if (stats.packetLoss > 0.5 || stats.jitter > 15 || stats.rtt > 50) {
      score = 4;
      recommendation = 'Good connection';
    }

    return {
      score,
      bandwidth: stats.bitrate,
      latency: stats.rtt,
      recommendation,
    };
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private async getLocalMedia(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: this.config.enableVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      } : false,
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
  }

  private handleRemoteTrack(event: RTCTrackEvent): void {
    const [stream] = event.streams;
    const participantId = event.transceiver?.mid || 'remote';
    
    this.remoteStreams.set(participantId, stream);
    
    // Update participant
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.videoStream = { stream, track: stream.getVideoTracks()[0] };
    }
  }

  private handleIceCandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      // Send candidate via signaling
      console.log('ICE candidate:', event.candidate);
    }
  }

  private handleConnectionStateChange(): void {
    const state = this.peerConnection?.connectionState;
    console.log('Connection state:', state);

    if (state === 'connected') {
      this.state = 'IN_CALL';
    } else if (state === 'disconnected' || state === 'failed') {
      this.state = 'ENDED';
    }
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleDataMessage(data);
    };
  }

  private handleDataMessage(data: any): void {
    console.log('Data channel message:', data);
  }

  private async sendOffer(participantId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send via signaling server
    console.log('Sending offer to:', participantId);
  }

  private async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    // In production, send via signaling server
    console.log('Sending answer');
  }

  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      this.getStats().then(stats => {
        console.log('Video stats:', stats);
      });
    }, 5000);
  }

  private stopStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }
}
