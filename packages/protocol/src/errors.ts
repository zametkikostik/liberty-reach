/**
 * Protocol Errors
 */

/**
 * Protocol error codes
 */
export type ProtocolErrorCode =
  | 'SUCCESS'
  | 'INVALID_MESSAGE'
  | 'INVALID_FRAME'
  | 'DECODE_ERROR'
  | 'ENCODE_ERROR'
  | 'VERSION_MISMATCH'
  | 'SIZE_EXCEEDED'
  | 'CRC_MISMATCH'
  | 'INVALID_TYPE'
  | 'MISSING_FIELD'
  | 'SESSION_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/**
 * Protocol error
 */
export interface ProtocolError extends Error {
  code: ProtocolErrorCode;
  cause?: unknown;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Create a protocol error
 */
export function createProtocolError(
  code: ProtocolErrorCode,
  message: string,
  cause?: unknown,
  context?: Record<string, unknown>
): ProtocolError {
  const error = new Error(message) as ProtocolError;
  error.name = 'ProtocolError';
  error.code = code;
  error.cause = cause;
  error.timestamp = new Date();
  error.context = context;
  return error;
}
