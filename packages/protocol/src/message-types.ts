/**
 * LRP Message Types
 * 
 * Defines the structure and types of Liberty Reach Protocol messages.
 */

/**
 * Protocol version
 */
export const LRP_VERSION = '1.0.0';

/**
 * Message types
 */
export enum MessageType {
  // Text messages
  TEXT = 0x01,
  MARKDOWN = 0x02,
  CODE = 0x03,
  
  // Media messages
  IMAGE = 0x10,
  VIDEO = 0x11,
  AUDIO = 0x12,
  VOICE_MESSAGE = 0x13,
  
  // File messages
  FILE = 0x20,
  DOCUMENT = 0x21,
  
  // System messages
  SYSTEM = 0x30,
  ENCRYPTION_INFO = 0x31,
  KEY_CHANGE = 0x32,
  
  // Call messages
  CALL_INVITE = 0x40,
  CALL_ACCEPT = 0x41,
  CALL_DECLINE = 0x42,
  CALL_END = 0x43,
  CALL_SIGNALING = 0x44,
  
  // Reaction and interaction
  REACTION = 0x50,
  EDIT = 0x51,
  DELETE = 0x52,
  REPLY = 0x53,
  FORWARD = 0x54,
  
  // Status
  TYPING = 0x60,
  ONLINE = 0x61,
  OFFLINE = 0x62,
  READ_RECEIPT = 0x63,
  DELIVERY_RECEIPT = 0x64,
}

/**
 * Message categories
 */
export enum MessageCategory {
  CHAT = 'chat',
  MEDIA = 'media',
  SYSTEM = 'system',
  CALL = 'call',
  CONTROL = 'control',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,      // Non-urgent (e.g., read receipts)
  NORMAL = 1,   // Regular messages
  HIGH = 2,     // Important messages
  URGENT = 3,   // Calls, encryption alerts
}

/**
 * LRP Message structure
 */
export interface LRPMessage {
  header: LRPHeader;
  body: LRPBody;
  metadata?: LRPMetadata;
}

/**
 * Message header
 */
export interface LRPHeader {
  version: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  timestamp: number;
  type: MessageType;
  priority: MessagePriority;
  flags: MessageFlags;
  encryptionInfo?: EncryptionInfo;
}

/**
 * Message flags
 */
export interface MessageFlags {
  encrypted: boolean;
  signed: boolean;
  compressed: boolean;
  requiresReceipt: boolean;
  isForwarded: boolean;
  isEdited: boolean;
  isDeleted: boolean;
}

/**
 * Message body - varies by message type
 */
export type LRPBody =
  | TextBody
  | MediaBody
  | FileBody
  | CallBody
  | SystemBody
  | ControlBody
  | ReactionBody;

/**
 * Text message body
 */
export interface TextBody {
  content: string;
  mentions?: Mention[];
  links?: LinkPreview[];
}

/**
 * Mention in text
 */
export interface Mention {
  userId: string;
  offset: number;
  length: number;
}

/**
 * Link preview
 */
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Media message body
 */
export interface MediaBody {
  mediaType: 'image' | 'video' | 'audio';
  mimeType: string;
  size: number;
  duration?: number; // For video/audio in ms
  width?: number;
  height?: number;
  thumbnail?: Uint8Array;
  caption?: string;
  // Media can be inline or referenced
  inlineData?: Uint8Array;
  reference?: MediaReference;
}

/**
 * Media reference (for large files)
 */
export interface MediaReference {
  type: 'ipfs' | 'http' | 'p2p';
  hash?: string;
  url?: string;
  peerId?: string;
}

/**
 * File message body
 */
export interface FileBody {
  filename: string;
  mimeType: string;
  size: number;
  hash?: string;
  inlineData?: Uint8Array;
  reference?: MediaReference;
}

/**
 * Call message body
 */
export interface CallBody {
  callId: string;
  callType: 'audio' | 'video' | 'group';
  action: 'invite' | 'accept' | 'decline' | 'end' | 'signaling';
  participants?: string[];
  sdp?: unknown;
  candidates?: unknown[];
  reason?: string;
  duration?: number;
}

/**
 * System message body
 */
export interface SystemBody {
  systemType: SystemMessageType;
  content: string;
  data?: Record<string, unknown>;
}

/**
 * System message types
 */
export enum SystemMessageType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_KICKED = 'user_kicked',
  NAME_CHANGED = 'name_changed',
  AVATAR_CHANGED = 'avatar_changed',
  ENCRYPTION_ENABLED = 'encryption_enabled',
  KEY_VERIFIED = 'key_verified',
}

/**
 * Control message body
 */
export interface ControlBody {
  controlType: ControlType;
  data: Record<string, unknown>;
}

/**
 * Control types
 */
export enum ControlType {
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  READ = 'read',
  DELIVERED = 'delivered',
  PRESENCE = 'presence',
}

/**
 * Reaction body
 */
export interface ReactionBody {
  messageId: string;
  reaction: string; // Unicode emoji or custom reaction ID
  action: 'add' | 'remove';
}

/**
 * Message metadata
 */
export interface LRPMetadata {
  // Delivery
  deliveredAt?: number;
  readAt?: number;
  playedAt?: number;
  
  // Editing
  editedAt?: number;
  editCount?: number;
  
  // Reactions
  reactions?: Map<string, string[]>; // reaction -> [userIds]
  
  // Reply chain
  replyTo?: string; // messageId being replied to
  threadId?: string; // Thread this message belongs to
  
  // Forwarding
  forwardedFrom?: ForwardInfo;
  
  // Scheduling
  scheduledFor?: number;
  expiresAt?: number; // For disappearing messages
  
  // Custom
  custom?: Record<string, unknown>;
}

/**
 * Forward information
 */
export interface ForwardInfo {
  originalConversationId: string;
  originalSenderId: string;
  originalTimestamp: number;
  forwardCount: number;
}

/**
 * Encryption information in header
 */
export interface EncryptionInfo {
  algorithm: string;
  keyVersion: number;
  signature?: Uint8Array;
  senderKeyHash?: Uint8Array;
}

/**
 * Get the category for a message type
 */
export function getMessageCategory(type: MessageType): MessageCategory {
  if (type >= 0x01 && type <= 0x03) return MessageCategory.CHAT;
  if (type >= 0x10 && type <= 0x13) return MessageCategory.MEDIA;
  if (type >= 0x20 && type <= 0x21) return MessageCategory.MEDIA;
  if (type >= 0x30 && type <= 0x32) return MessageCategory.SYSTEM;
  if (type >= 0x40 && type <= 0x44) return MessageCategory.CALL;
  if (type >= 0x50 && type <= 0x54) return MessageCategory.CHAT;
  if (type >= 0x60 && type <= 0x64) return MessageCategory.CONTROL;
  return MessageCategory.CHAT;
}

/**
 * Get the default priority for a message type
 */
export function getDefaultPriority(type: MessageType): MessagePriority {
  if (type >= 0x40 && type <= 0x44) return MessagePriority.URGENT; // Calls
  if (type === 0x31 || type === 0x32) return MessagePriority.HIGH; // Encryption
  if (type >= 0x60 && type <= 0x64) return MessagePriority.LOW; // Control
  return MessagePriority.NORMAL;
}
