/**
 * VoIP Types
 */

/**
 * Phone number format
 */
export interface PhoneNumber {
  country: string;
  country_code: string;
  number: string;
  formatted: string;
  type: 'mobile' | 'landline' | 'voip' | 'toll_free';
}

/**
 * Internal number format
 */
export interface InternalNumber {
  id: string;
  userId: string;
  number: string; // e.g., "1001", "2002"
  extension: string;
  displayName: string;
  capabilities: NumberCapabilities;
  createdAt: number;
}

/**
 * Number capabilities
 */
export interface NumberCapabilities {
  canCall: boolean;
  canReceiveCall: boolean;
  canSMS: boolean;
  canMMS: boolean;
  canVoicemail: boolean;
  canForward: boolean;
  canConference: boolean;
}

/**
 * Call record
 */
export interface CallRecord {
  id: string;
  callId: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound' | 'missed';
  status: 'completed' | 'missed' | 'rejected' | 'failed' | 'voicemail';
  startTime: number;
  endTime?: number;
  duration: number;
  recording?: string;
  voicemail?: Voicemail;
}

/**
 * Call log entry
 */
export interface CallLog {
  id: string;
  phoneNumber: string;
  contactName?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration: number;
  recording?: string;
}

/**
 * Voicemail
 */
export interface Voicemail {
  id: string;
  callId: string;
  fromNumber: string;
  fromName?: string;
  duration: number;
  audioUrl: string;
  transcript?: string;
  isRead: boolean;
  isSaved: boolean;
  createdAt: number;
}

/**
 * Call forwarding rule
 */
export interface ForwardingRule {
  id: string;
  numberId: string;
  forwardTo: string;
  condition: 'always' | 'busy' | 'no_answer' | 'offline';
  timeout: number;
  enabled: boolean;
}

/**
 * VoIP call state
 */
export type CallState =
  | 'IDLE'
  | 'DIALING'
  | 'RINGING'
  | 'IN_CALL'
  | 'ON_HOLD'
  | 'TRANSFERRING'
  | 'CONFERENCE'
  | 'ENDED';
