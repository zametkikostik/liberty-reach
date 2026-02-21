/**
 * Liberty Reach Protocol (LRP)
 * 
 * Wire protocol and message format for Liberty Reach Messenger.
 * 
 * @module @liberty-reach/protocol
 */

// Message types
export {
  MessageType,
  MessageCategory,
  MessagePriority,
  type LRPMessage,
  type LRPMetadata,
  type LRPHeader,
  type LRPBody,
} from './message-types.js';

// Frame format
export {
  FrameType,
  type LRPFrame,
  type FrameHeader,
  FRAME_MAGIC,
  FRAME_VERSION,
  MAX_FRAME_SIZE,
} from './frame-format.js';

// Session management
export {
  SessionType,
  type SessionInfo,
  type SessionState,
  type SessionConfig,
} from './session.js';

// Conversation
export {
  ConversationType,
  type Conversation,
  type ConversationMember,
  type ConversationSettings,
} from './conversation.js';

// Contact
export {
  type Contact,
  type ContactProfile,
  type PublicKeyRegistry,
} from './contact.js';

// Codec
export { LRPEncoder, LRPDecoder, type EncodeOptions, type DecodeOptions } from './codec.js';

// Constants
export {
  PROTOCOL_VERSION,
  MIN_PROTOCOL_VERSION,
  PROTOCOL_NAME,
  DEFAULT_MESSAGE_TTL,
  MAX_MESSAGE_SIZE,
  MAX_ATTACHMENT_SIZE,
} from './constants.js';

// Errors
export type { ProtocolError, ProtocolErrorCode } from './errors.js';
