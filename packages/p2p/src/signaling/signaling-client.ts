/**
 * Signaling Client - WebSocket Signaling for P2P
 * 
 * Coordinates P2P connection establishment through a signaling server.
 * Exchanges SDP offers/answers and ICE candidates.
 */

import type {
  SignalingMessage,
  SignalingState,
  SignalingMessageType,
  IceCandidate,
  P2PError,
} from '../types.js';
import { createP2PError } from '../utils/p2p-utils.js';

/**
 * Signaling client options
 */
export interface SignalingOptions {
  peerId: string;
  localPeerId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

/**
 * Signaling event handlers
 */
export interface SignalingHandlers {
  onOffer?: (offer: unknown, from: string) => void;
  onAnswer?: (answer: unknown, from: string) => void;
  onCandidate?: (candidate: IceCandidate, from: string) => void;
  onCandidatesComplete?: (from: string) => void;
  onClose?: (reason: string) => void;
  onError?: (error: P2PError) => void;
}

/**
 * SignalingClient - WebSocket signaling implementation
 * 
 * Provides:
 * - Peer registration and discovery
 * - SDP offer/answer exchange
 * - ICE candidate relay
 * - Presence tracking
 * - Connection keepalive
 */
export class SignalingClient {
  private url: string;
  private options: SignalingOptions;
  private state: SignalingState = 'DISCONNECTED';
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: SignalingMessage[] = [];
  private handlers: SignalingHandlers = {};

  /**
   * Create a new Signaling Client
   * 
   * @param url - WebSocket signaling server URL
   * @param options - Client options
   */
  constructor(url: string, options: SignalingOptions) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...options,
    };
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: SignalingHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get current state
   */
  getState(): SignalingState {
    return this.state;
  }

  /**
   * Connect to signaling server
   */
  async connect(): Promise<void> {
    if (this.state === 'CONNECTED' || this.state === 'CONNECTING') {
      return;
    }

    this.setState('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.setState('CONNECTED');
          this.onConnected();
          resolve();
        };

        this.ws.onerror = (event) => {
          const error = createP2PError('SIGNALED_ERROR', 'WebSocket error', event);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.onMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.onClose(event.code, event.reason);
        };
      } catch (error) {
        reject(createP2PError('SIGNALED_ERROR', 'Failed to create WebSocket', error));
      }
    });
  }

  /**
   * Disconnect from signaling server
   */
  async disconnect(): Promise<void> {
    this.stopReconnect();
    this.stopPing();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.setState('DISCONNECTED');
  }

  /**
   * Send SDP offer to peer
   */
  async sendOffer(offer: unknown): Promise<void> {
    await this.sendMessage({
      type: 'OFFER',
      from: this.options.localPeerId,
      to: this.options.peerId,
      conversationId: this.getConversationId(),
      payload: offer,
      timestamp: Date.now(),
    });
  }

  /**
   * Send SDP answer to peer
   */
  async sendAnswer(answer: unknown): Promise<void> {
    await this.sendMessage({
      type: 'ANSWER',
      from: this.options.localPeerId,
      to: this.options.peerId,
      conversationId: this.getConversationId(),
      payload: answer,
      timestamp: Date.now(),
    });
  }

  /**
   * Send ICE candidate to peer
   */
  async sendCandidate(candidate: IceCandidate): Promise<void> {
    await this.sendMessage({
      type: 'ICE_CANDIDATE',
      from: this.options.localPeerId,
      to: this.options.peerId,
      conversationId: this.getConversationId(),
      payload: candidate,
      timestamp: Date.now(),
    });
  }

  /**
   * Send ICE candidates complete notification
   */
  async sendCandidatesComplete(): Promise<void> {
    await this.sendMessage({
      type: 'ICE_CANDIDATES_COMPLETE',
      from: this.options.localPeerId,
      to: this.options.peerId,
      conversationId: this.getConversationId(),
      timestamp: Date.now(),
    });
  }

  /**
   * Send ping to server
   */
  async sendPing(): Promise<void> {
    await this.sendMessage({
      type: 'PING',
      from: this.options.localPeerId,
      to: 'server',
      conversationId: 'ping',
      timestamp: Date.now(),
    });
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  private setState(state: SignalingState): void {
    this.state = state;
  }

  private onConnected(): void {
    this.reconnectAttempts = 0;
    this.startPing();
    this.flushMessageQueue();
  }

  private onMessage(data: string): void {
    try {
      const message = JSON.parse(data) as SignalingMessage;
      this.handleMessage(message);
    } catch (error) {
      console.error('Failed to parse signaling message:', error);
    }
  }

  private handleMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'OFFER':
        if (this.handlers.onOffer) {
          this.handlers.onOffer(message.payload!, message.from);
        }
        break;

      case 'ANSWER':
        if (this.handlers.onAnswer) {
          this.handlers.onAnswer(message.payload!, message.from);
        }
        break;

      case 'ICE_CANDIDATE':
        if (this.handlers.onCandidate && message.payload) {
          this.handlers.onCandidate(message.payload as IceCandidate, message.from);
        }
        break;

      case 'ICE_CANDIDATES_COMPLETE':
        if (this.handlers.onCandidatesComplete) {
          this.handlers.onCandidatesComplete(message.from);
        }
        break;

      case 'PONG':
        // Ping response received
        break;

      case 'CLOSE':
        if (this.handlers.onClose) {
          this.handlers.onClose(message.payload as string || 'Remote peer closed');
        }
        break;
    }
  }

  private onClose(code: number, reason: string): void {
    this.stopPing();
    this.setState('DISCONNECTED');

    if (code !== 1000) {
      // Abnormal close - attempt reconnect
      this.scheduleReconnect();
    }

    if (this.handlers.onClose) {
      this.handlers.onClose(reason);
    }
  }

  private async sendMessage(message: SignalingMessage): Promise<void> {
    if (this.state !== 'CONNECTED' || !this.ws) {
      // Queue message for later
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.messageQueue.push(message);
      throw createP2PError('SIGNALED_ERROR', 'Failed to send message', error);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.state === 'CONNECTED') {
      const message = this.messageQueue.shift()!;
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  private startPing(): void {
    this.stopPing();
    
    this.pingTimer = setInterval(() => {
      this.sendPing().catch(console.error);
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      if (this.handlers.onError) {
        this.handlers.onError(
          createP2PError('CONNECTION_FAILED', 'Max reconnect attempts reached')
        );
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private getConversationId(): string {
    // Generate consistent conversation ID based on peer IDs
    const [a, b] = [this.options.localPeerId, this.options.peerId].sort();
    return `${a}_${b}`;
  }
}

/**
 * Create a P2P error
 */
function createP2PError(code: string, message: string, cause?: unknown): P2PError {
  const error = new Error(message) as P2PError;
  error.name = 'P2PError';
  (error as unknown as { code: string }).code = code as never;
  error.cause = cause;
  error.timestamp = new Date();
  return error;
}
