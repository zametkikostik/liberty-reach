# @liberty-reach/p2p

P2P Networking Module for Liberty Reach Messenger.

## Features

- **ICE/STUN/TURN** - Full NAT traversal support (RFC 8445, 5389, 5766)
- **UDP Hole Punching** - Direct P2P connections through most NATs
- **Symmetric NAT Bypass** - Port prediction for difficult NATs
- **TURN Relay** - Fallback for when direct connection fails
- **WebSocket Fallback** - Last resort via signaling server
- **libp2p Integration** - Noise encryption + Yamux multiplexing
- **Connection Quality** - Real-time metrics and quality assessment

## Installation

```bash
npm install @liberty-reach/p2p
```

## Usage

### Basic Connection

```typescript
import { ConnectionManager } from '@liberty-reach/p2p';

const connection = new ConnectionManager({
  peerId: 'remote-peer-id',
  localPeerId: 'my-peer-id',
  signalingUrl: 'wss://signal.libertyreach.io',
  turnServers: [
    {
      host: 'turn.libertyreach.io',
      port: 5349,
      username: 'user',
      password: 'pass',
      protocols: ['udp', 'tcp'],
    },
  ],
});

connection.setHandlers({
  onStateChange: (state) => console.log('State:', state),
  onConnected: () => console.log('Connected!'),
  onDisconnected: () => console.log('Disconnected'),
  onMetrics: (metrics) => console.log('Metrics:', metrics),
});

await connection.connect();
```

### ICE Agent Direct Usage

```typescript
import { IceAgent } from '@liberty-reach/p2p';

const ice = new IceAgent({
  stunServers: [
    { host: 'stun.l.google.com', port: 19302 },
  ],
});

ice.onCandidate = (candidate) => {
  // Send candidate to peer via signaling
};

ice.onStateChange = (state) => {
  if (state === 'COMPLETED') {
    const pair = ice.getSelectedPair();
    console.log('Selected pair:', pair);
  }
};

await ice.startGathering();
```

### STUN Client

```typescript
import { StunClient } from '@liberty-reach/p2p';

const stun = new StunClient({
  host: 'stun.l.google.com',
  port: 19302,
});

const binding = await stun.sendBindingRequest();
console.log('Public IP:', binding.publicIp);
console.log('Public Port:', binding.publicPort);
```

### TURN Client

```typescript
import { TurnClient } from '@liberty-reach/p2p';

const turn = new TurnClient({
  host: 'turn.libertyreach.io',
  port: 5349,
  username: 'user',
  password: 'pass',
  protocols: ['udp', 'tcp'],
});

const allocation = await turn.allocate({
  username: 'user',
  password: 'pass',
});

console.log('Relay address:', allocation.relayAddress);
console.log('Relay port:', allocation.relayPort);
```

### Signaling Client

```typescript
import { SignalingClient } from '@liberty-reach/p2p';

const signaling = new SignalingClient('wss://signal.libertyreach.io', {
  peerId: 'remote-peer',
  localPeerId: 'my-peer',
});

signaling.setHandlers({
  onOffer: (offer, from) => handleOffer(offer),
  onAnswer: (answer, from) => handleAnswer(answer),
  onCandidate: (candidate, from) => addCandidate(candidate),
});

await signaling.connect();
await signaling.sendOffer(sdp);
```

### Libp2p Node

```typescript
import { Libp2pNode } from '@liberty-reach/p2p';

const node = new Libp2pNode({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0/ws'],
  },
  connectionManager: {
    minConnections: 1,
    maxConnections: 100,
  },
  transport: {
    websockets: true,
    webrtc: true,
  },
  muxers: ['yamux'],
  cryptos: ['noise'],
});

await node.registerProtocol('/liberty-reach/chat/1.0.0', async (data, peerId) => {
  console.log('Received from', peerId, ':', data);
  return new TextEncoder().encode('ACK');
});

await node.start();
await node.connect('remote-peer-id', ['/ip4/.../ws']);
await node.send('remote-peer-id', '/liberty-reach/chat/1.0.0', message);
```

## Connection States

```
INITIALIZING → GATHERING → CONNECTING → [Connection Type] → CONNECTED
                                              ↓
                                    DIRECT (best)
                                    STUN_PUNCH
                                    SYMMETRIC_BYPASS
                                    TURN_RELAY
                                    WEBSOCKET_FALLBACK (worst)
```

## NAT Traversal Strategy

1. **Direct Connection** - Same LAN or public IP (RTT < 10ms)
2. **UDP Hole Punching** - Most cone NATs (RTT 20-100ms)
3. **Port Prediction** - Symmetric NAT bypass (RTT 50-150ms)
4. **TURN Relay** - When P2P impossible (RTT 100-300ms)
5. **WebSocket** - Last resort via server (RTT 50-500ms)

## Network Metrics

```typescript
interface NetworkMetrics {
  rtt: number;              // Round-trip time (ms)
  jitter: number;           // Jitter (ms)
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  packetLossRate: number;   // 0.0 to 1.0
  availableBandwidth: number; // bps
  candidateType: 'host' | 'srflx' | 'relay';
  natType: number;
}
```

## Connection Quality

| Quality | RTT | Jitter | Packet Loss |
|---------|-----|--------|-------------|
| EXCELLENT | < 50ms | < 10ms | < 1% |
| GOOD | < 100ms | < 30ms | < 5% |
| FAIR | < 200ms | < 50ms | < 10% |
| POOR | < 500ms | < 100ms | < 20% |
| FAILED | > 500ms | > 100ms | > 20% |

## API Reference

### ConnectionManager

- `connect()` - Initiate connection
- `accept(offer)` - Accept incoming connection
- `send(data)` - Send data to peer
- `close()` - Close connection
- `reconnect()` - Attempt reconnection
- `getState()` - Get current state
- `getMetrics()` - Get network metrics
- `getQuality()` - Get connection quality

### IceAgent

- `startGathering()` - Start ICE candidate gathering
- `addRemoteCandidate(candidate)` - Add remote candidate
- `setRemoteCandidatesComplete()` - Signal end of candidates
- `getLocalCandidates()` - Get local candidates
- `getSelectedPair()` - Get selected candidate pair
- `restart()` - Restart ICE

### StunClient

- `sendBindingRequest()` - Send STUN binding request
- `testConnectivity()` - Test server reachability

### TurnClient

- `allocate(credentials)` - Allocate relay address
- `createPermission(peer)` - Create peer permission
- `bindChannel(peer)` - Bind channel for peer
- `sendData(data, peer)` - Send data via relay
- `refresh(credentials)` - Refresh allocation
- `release()` - Release allocation

### SignalingClient

- `connect()` - Connect to signaling server
- `disconnect()` - Disconnect
- `sendOffer(offer)` - Send SDP offer
- `sendAnswer(answer)` - Send SDP answer
- `sendCandidate(candidate)` - Send ICE candidate

### Libp2pNode

- `start()` - Start node
- `stop()` - Stop node
- `connect(peerId, multiaddrs)` - Connect to peer
- `disconnect(peerId)` - Disconnect from peer
- `send(peerId, protocol, data)` - Send message
- `sendRequest(peerId, protocol, data)` - Send request/response

## License

AGPL-3.0-or-later
