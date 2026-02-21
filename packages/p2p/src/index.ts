/**
 * Liberty Reach P2P Module
 * 
 * Peer-to-Peer networking for Liberty Reach Messenger.
 * Implements NAT traversal, WebRTC, and libp2p integration.
 * 
 * @module @liberty-reach/p2p
 */

// ICE/STUN/TURN
export { IceAgent, type IceCandidate, type IceCandidateType, type IceState } from './ice/ice-agent.js';
export { StunClient, type StunBinding, type StunServer } from './stun/stun-client.js';
export { TurnClient, type TurnAllocation, type TurnCredentials } from './turn/turn-client.js';

// NAT Traversal
export { HolePuncher, type PunchResult, type PunchStrategy } from './nat/hole-puncher.js';
export { ConnectionManager, type ConnectionState, type ConnectionStrategy } from './connection/connection-manager.js';

// Signaling
export { SignalingClient, type SignalingMessage, type SignalingState } from './signaling/signaling-client.js';

// Libp2p Integration
export { Libp2pNode, type Libp2pNodeOptions, type PeerInfo } from './libp2p/libp2p-node.js';

// Types and Constants
export {
  type P2PError,
  type P2PErrorCode,
  type NetworkMetrics,
  type ConnectionQuality,
  NAT_TYPE_UNKNOWN,
  NAT_TYPE_NONE,
  NAT_TYPE_FULL_CONE,
  NAT_TYPE_RESTRICTED_CONE,
  NAT_TYPE_PORT_RESTRICTED_CONE,
  NAT_TYPE_SYMMETRIC,
  MAX_CANDIDATE_PAIRS,
  ICE_TIMEOUT,
  STUN_RETRY_COUNT,
  TURN_BANDWIDTH_ESTIMATE,
} from './types.js';

// Utilities
export {
  parseCandidate,
  serializeCandidate,
  parseStunMessage,
  createStunMessage,
  calculateConnectionQuality,
} from './utils/p2p-utils.js';
