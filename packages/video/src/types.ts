/**
 * Video Types
 */

/**
 * Video stream info
 */
export interface VideoStream {
  stream: MediaStream;
  track: MediaStreamTrack;
  sender?: RTCRtpSender;
}

/**
 * Participant in video call
 */
export interface Participant {
  id: string;
  name: string;
  videoStream?: VideoStream;
  audioStream?: MediaStream;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  networkQuality: number;
  joinedAt: number;
}

/**
 * Video statistics
 */
export interface VideoStats {
  resolution: { width: number; height: number };
  framerate: number;
  bitrate: number;
  packetLoss: number;
  jitter: number;
  rtt: number;
}

/**
 * Network quality
 */
export interface NetworkQuality {
  score: number; // 0-5
  bandwidth: number;
  latency: number;
  recommendation: string;
}
