/**
 * Voice Conferencing Types
 */

/**
 * Conference member information
 */
export interface ConferenceMember {
  id: string;
  name: string;
  joinedAt: number;
  isSpeaking: boolean;
  isMuted: boolean;
  isModerator: boolean;
  connectionQuality: number;
}

/**
 * Conference event types
 */
export type ConferenceEventType =
  | 'member_joined'
  | 'member_left'
  | 'talking_started'
  | 'talking_stopped'
  | 'mute_toggled'
  | 'talk_timeout'
  | 'idle_timeout'
  | 'voice_frame'
  | 'member_event';

/**
 * Conference event
 */
export interface ConferenceEvent {
  type: ConferenceEventType;
  memberId?: string;
  memberName?: string;
  targetMemberId?: string;
  frame?: VoiceFrame;
  isMuted?: boolean;
  timestamp: number;
}

/**
 * Voice frame for audio transmission
 */
export interface VoiceFrame {
  sequenceNumber: number;
  timestamp: number;
  samples: Float32Array;
  isLastFrame: boolean;
}

/**
 * Connection quality metrics
 */
export interface ConnectionQuality {
  score: number; // 0-1
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // 0-1
  bandwidth: number; // bps
}
