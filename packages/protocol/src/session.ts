/**
 * Session and Conversation Types
 */

/**
 * Session types
 */
export enum SessionType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
  BROADCAST = 'broadcast',
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  type: SessionType;
  participants: string[];
  createdAt: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session state
 */
export interface SessionState {
  sessionId: string;
  isActive: boolean;
  lastActivity: number;
  messageCount: number;
  unreadCount: number;
  lastMessageId?: string;
  lastMessagePreview?: string;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  maxParticipants: number;
  allowInvites: boolean;
  allowHistory: boolean;
  disappearingMessages?: number; // TTL in ms
  encryptionEnabled: boolean;
}

/**
 * Conversation types
 */
export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
  CHANNEL = 'channel',
  SECRET = 'secret',
}

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  avatar?: string;
  ownerId?: string;
  members: ConversationMember[];
  settings: ConversationSettings;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
}

/**
 * Conversation member
 */
export interface ConversationMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  invitedBy?: string;
  permissions: MemberPermissions;
}

/**
 * Member permissions
 */
export interface MemberPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canChangeInfo: boolean;
  canPinMessages: boolean;
}

/**
 * Conversation settings
 */
export interface ConversationSettings {
  notificationsEnabled: boolean;
  notificationSound?: string;
  showPreview: boolean;
  disappearingMessages?: number;
  joinApprovalRequired: boolean;
  historyVisible: boolean;
}

/**
 * Contact
 */
export interface Contact {
  userId: string;
  displayName: string;
  username?: string;
  phoneNumber?: string;
  avatar?: string;
  status?: string;
  publicKey?: Uint8Array;
  lastSeen?: number;
  isBlocked: boolean;
  isFavorite: boolean;
  addedAt: number;
}

/**
 * Contact profile
 */
export interface ContactProfile {
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  username?: string;
  publicKeys: {
    identity: Uint8Array;
    signedPreKey: Uint8Array;
    oneTimePreKeys: Array<{ id: number; key: Uint8Array }>;
  };
  verified: boolean;
  verificationMethod?: 'manual' | 'qr' | 'number';
}

/**
 * Public key registry entry
 */
export interface PublicKeyRegistry {
  userId: string;
  identityKey: Uint8Array;
  identityKeySignature: Uint8Array;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  oneTimePreKeys: Array<{ id: number; key: Uint8Array; signature: Uint8Array }>;
  lastUpdate: number;
  version: number;
}
