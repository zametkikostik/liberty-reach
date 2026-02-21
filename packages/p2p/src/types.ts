/**
 * P2P Module Types and Constants
 */

/**
 * P2P error codes
 */
export type P2PErrorCode =
  | 'SUCCESS'
  | 'CONNECTION_FAILED'
  | 'ICE_FAILED'
  | 'STUN_FAILED'
  | 'TURN_FAILED'
  | 'SIGNALED_ERROR'
  | 'TIMEOUT'
  | 'INVALID_CANDIDATE'
  | 'NAT_TRAVERSAL_FAILED'
  | 'PEER_DISCONNECTED'
  | 'PROTOCOL_ERROR'
  | 'CERTIFICATE_ERROR'
  | 'RESOURCE_EXHAUSTED'
  | 'INVALID_STATE';

/**
 * P2P error with detailed information
 */
export interface P2PError extends Error {
  code: P2PErrorCode;
  cause?: unknown;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * NAT type as defined in RFC 3489
 */
export const NAT_TYPE_UNKNOWN = 0;
export const NAT_TYPE_NONE = 1; // No NAT (public IP)
export const NAT_TYPE_FULL_CONE = 2;
export const NAT_TYPE_RESTRICTED_CONE = 3;
export const NAT_TYPE_PORT_RESTRICTED_CONE = 4;
export const NAT_TYPE_SYMMETRIC = 5;

export type NatType =
  | typeof NAT_TYPE_UNKNOWN
  | typeof NAT_TYPE_NONE
  | typeof NAT_TYPE_FULL_CONE
  | typeof NAT_TYPE_RESTRICTED_CONE
  | typeof NAT_TYPE_PORT_RESTRICTED_CONE
  | typeof NAT_TYPE_SYMMETRIC;

/**
 * ICE candidate types
 */
export type IceCandidateType = 'host' | 'srflx' | 'prflx' | 'relay';

/**
 * ICE connection state
 */
export type IceState =
  | 'NEW'
  | 'CHECKING'
  | 'CONNECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'DISCONNECTED'
  | 'CLOSED';

/**
 * Connection state for ConnectionManager
 */
export type ConnectionState =
  | 'INITIALIZING'
  | 'GATHERING'
  | 'CONNECTING'
  | 'DIRECT'
  | 'STUN_PUNCH'
  | 'SYMMETRIC_BYPASS'
  | 'TURN_RELAY'
  | 'WEBSOCKET_FALLBACK'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'FAILED';

/**
 * Connection strategy
 */
export type ConnectionStrategy = 'AGGRESSIVE' | 'CONSERVATIVE' | 'LOW_LATENCY';

/**
 * Network metrics
 */
export interface NetworkMetrics {
  // Latency
  rtt: number; // Round-trip time in ms
  jitter: number; // Jitter in ms
  
  // Packet statistics
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  packetLossRate: number; // 0.0 to 1.0
  
  // Bandwidth
  availableBandwidth: number; // bits per second
  estimatedBandwidth: number; // bits per second
  
  // Connection info
  candidateType: IceCandidateType;
  natType: NatType;
  relayProtocol?: 'udp' | 'tcp' | 'tls';
  
  // Timestamp
  timestamp: number;
}

/**
 * Connection quality assessment
 */
export type ConnectionQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'FAILED';

/**
 * ICE candidate interface
 */
export interface IceCandidate {
  foundation: string;
  component: number;
  protocol: 'udp' | 'tcp';
  priority: number;
  ip: string;
  port: number;
  type: IceCandidateType;
  relatedAddress?: string;
  relatedPort?: number;
  tcpType?: 'active' | 'passive' | 'so';
  generation?: number;
  raw?: string;
}

/**
 * STUN server configuration
 */
export interface StunServer {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * TURN server configuration
 */
export interface TurnServer extends StunServer {
  protocols: ('udp' | 'tcp' | 'tls')[];
}

/**
 * ICE configuration
 */
export interface IceConfig {
  stunServers: StunServer[];
  turnServers: TurnServer[];
  iceLite?: boolean;
  gatheringTimeout: number;
  connectionTimeout: number;
  maxCandidatePairs: number;
}

/**
 * Signaling message types
 */
export type SignalingMessageType =
  | 'OFFER'
  | 'ANSWER'
  | 'ICE_CANDIDATE'
  | 'ICE_CANDIDATES_COMPLETE'
  | 'PING'
  | 'PONG'
  | 'CLOSE';

/**
 * Signaling message
 */
export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string;
  conversationId: string;
  payload?: unknown;
  candidates?: IceCandidate[];
  timestamp: number;
}

/**
 * Peer information
 */
export interface PeerInfo {
  peerId: string;
  addresses: string[]; // Multiaddrs
  protocols: string[];
  lastSeen: number;
  connectionType?: 'direct' | 'relay';
  latency?: number;
}

/**
 * libp2p node options
 */
export interface Libp2pNodeOptions {
  peerId?: string;
  addresses: {
    listen: string[];
    announce?: string[];
  };
  connectionManager: {
    minConnections: number;
    maxConnections: number;
  };
  transport: {
    websockets?: boolean;
    webrtc?: boolean;
    tcp?: boolean;
  };
  muxers: string[];
  cryptos: string[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of ICE candidate pairs to check
 */
export const MAX_CANDIDATE_PAIRS = 100;

/**
 * ICE gathering timeout in milliseconds
 */
export const ICE_TIMEOUT = 30000;

/**
 * STUN request retry count
 */
export const STUN_RETRY_COUNT = 3;

/**
 * TURN bandwidth estimate in bits per second
 */
export const TURN_BANDWIDTH_ESTIMATE = 500000; // 500 kbps

/**
 * Default STUN servers (Google's public STUN)
 */
export const DEFAULT_STUN_SERVERS: StunServer[] = [
  { host: 'stun.l.google.com', port: 19302 },
  { host: 'stun1.l.google.com', port: 19302 },
  { host: 'stun2.l.google.com', port: 19302 },
  { host: 'stun3.l.google.com', port: 19302 },
  { host: 'stun4.l.google.com', port: 19302 },
];

/**
 * Connection quality thresholds
 */
export const QUALITY_THRESHOLDS = {
  EXCELLENT: { maxRtt: 50, maxJitter: 10, maxPacketLoss: 0.01 },
  GOOD: { maxRtt: 100, maxJitter: 30, maxPacketLoss: 0.05 },
  FAIR: { maxRtt: 200, maxJitter: 50, maxPacketLoss: 0.1 },
  POOR: { maxRtt: 500, maxJitter: 100, maxPacketLoss: 0.2 },
};

/**
 * Protocol version
 */
export const P2P_PROTOCOL_VERSION = '1.0.0';

/**
 * Message types for libp2p protocols
 */
export const LIBERTY_REACH_PROTOCOLS = {
  CHAT: '/liberty-reach/chat/1.0.0',
  CALL: '/liberty-reach/call/1.0.0',
  FILE: '/liberty-reach/file/1.0.0',
  SIGNALING: '/liberty-reach/signaling/1.0.0',
};
