/**
 * Protocol Constants
 */

/**
 * Current protocol version
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Minimum supported protocol version
 */
export const MIN_PROTOCOL_VERSION = '1.0.0';

/**
 * Protocol name
 */
export const PROTOCOL_NAME = 'Liberty Reach Protocol';

/**
 * Default message TTL (30 days)
 */
export const DEFAULT_MESSAGE_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * Maximum message size (10MB)
 */
export const MAX_MESSAGE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum attachment size (2GB)
 */
export const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024 * 1024;

/**
 * Maximum messages per batch
 */
export const MAX_MESSAGES_PER_BATCH = 100;

/**
 * Maximum reactions per message
 */
export const MAX_REACTIONS_PER_MESSAGE = 50;

/**
 * Maximum mentions per message
 */
export const MAX_MENTIONS_PER_MESSAGE = 20;

/**
 * Maximum message edit count
 */
export const MAX_MESSAGE_EDITS = 10;

/**
 * Keep-alive interval (30 seconds)
 */
export const KEEPALIVE_INTERVAL = 30 * 1000;

/**
 * Connection timeout (60 seconds)
 */
export const CONNECTION_TIMEOUT = 60 * 1000;

/**
 * Message acknowledgment timeout (10 seconds)
 */
export const ACK_TIMEOUT = 10 * 1000;

/**
 * Maximum reconnection attempts
 */
export const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Reconnection base delay (1 second)
 */
export const RECONNECT_BASE_DELAY = 1000;

/**
 * Reconnection max delay (60 seconds)
 */
export const RECONNECT_MAX_DELAY = 60 * 1000;
