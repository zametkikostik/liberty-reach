# Liberty Reach Architecture

## System Overview

Liberty Reach is a post-quantum secure messenger with the following architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                        │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│    iOS      │   Android   │   Windows   │    macOS    │  Linux / Web    │
│  (React     │  (React     │  (Tauri +   │  (Tauri +   │  (Next.js +     │
│   Native)   │   Native)   │   Rust)     │   Rust)     │   WASM)         │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴───────┬─────────┘
       │             │             │             │              │
       └─────────────┴─────────────┼─────────────┴──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Liberty Reach Cloud     │
                    ├─────────────────────────────┤
                    │  ┌─────────────────────┐    │
                    │  │  Signaling Server   │    │
                    │  │  (Go + WebSocket)   │    │
                    │  └──────────┬──────────┘    │
                    │             │               │
                    │  ┌──────────▼──────────┐    │
                    │  │   API Gateway       │    │
                    │  │   (Rust + Axum)     │    │
                    │  └──────────┬──────────┘    │
                    │             │               │
                    │  ┌──────────▼──────────┐    │
                    │  │   TURN/STUN Server  │    │
                    │  │   (coturn)          │    │
                    │  └─────────────────────┘    │
                    │                             │
                    │  ┌──────────────────────┐   │
                    │  │  PostgreSQL + Redis  │   │
                    │  └──────────────────────┘   │
                    └─────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     P2P Connections         │
                    │  (WebRTC + libp2p + ICE)    │
                    └─────────────────────────────┘
```

## Core Components

### Client Applications

| Platform | Technology | Features |
|----------|------------|----------|
| iOS | React Native + Swift | Native crypto, CallKit, Keychain |
| Android | React Native + Kotlin | Native crypto, ConnectionService, Keystore |
| Windows | Tauri v2 + Rust | Native crypto, Windows notifications |
| macOS | Tauri v2 + Rust | Native crypto, APNs, Keychain |
| Linux | Tauri v2 + Rust | Native crypto, libnotify |
| Web | Next.js 14 + WASM | WASM crypto, PWA, IndexedDB |

### Shared Packages

```
packages/
├── crypto/       # Post-quantum cryptography
│   ├── Kyber-1024    (NIST FIPS 203)
│   ├── Dilithium5    (NIST FIPS 204)
│   ├── X25519        (Classic ECDH)
│   ├── AES-256-GCM   (Symmetric encryption)
│   └── Double Ratchet (Signal Protocol)
│
├── p2p/          # P2P networking
│   ├── ICE/STUN/TURN
│   ├── WebRTC
│   ├── libp2p
│   └── UDP Hole Punching
│
├── protocol/     # Wire protocol
│   ├── LRP (Liberty Reach Protocol)
│   ├── Message framing
│   └── Session management
│
├── ui/           # Shared UI components
│   ├── Themed components
│   ├── Chat bubbles
│   └── Call views
│
├── storage/      # Encrypted storage
│   ├── SQLCipher
│   └── libsodium
│
└── notifications/ # Push notifications
    ├── FCM (Android)
    ├── APNs (iOS/macOS)
    └── WNS (Windows)
```

### Server Infrastructure

| Service | Technology | Purpose |
|---------|------------|---------|
| Signaling | Go + gorilla/websocket | WebSocket signaling for P2P |
| API Gateway | Rust + Axum | REST + gRPC API |
| TURN/STUN | coturn | NAT traversal relay |
| PostgreSQL | PostgreSQL 16 | User data, metadata |
| Redis | Redis 7 | Caching, pub/sub, presence |
| NATS | NATS 2 | Message queue |

## Security Architecture

### End-to-End Encryption

```
┌─────────────────────────────────────────────────────────────┐
│                    Key Agreement (X3DH)                      │
│                                                              │
│  Alice                                    Bob               │
│    │                                       │                │
│    │──── PreKey Bundle (PQ + Classic) ───▶│                │
│    │                                       │                │
│    │◄──── PreKey Bundle (PQ + Classic) ───│                │
│    │                                       │                │
│    │  [Kyber-1024 + X25519 Hybrid KEM]     │                │
│    │                                       │                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Double Ratchet Protocol                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Root Key Chain                                      │    │
│  │       │                                              │    │
│  │       ▼                                              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │
│  │  │ DH Key  │─▶│ DH Key  │─▶│ DH Key  │─ ...        │    │
│  │  │ Chain 1 │  │ Chain 2 │  │ Chain 3 │              │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘              │    │
│  │       │            │            │                    │    │
│  │       ▼            ▼            ▼                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │
│  │  │ Message │  │ Message │  │ Message │              │    │
│  │  │  Keys   │  │  Keys   │  │  Keys   │              │    │
│  │  └─────────┘  └─────────┘  └─────────┘              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Cryptographic Primitives

| Purpose | Algorithm | Security Level |
|---------|-----------|----------------|
| Key Encapsulation | CRYSTALS-Kyber-1024 | NIST Level 5 (PQ) |
| Digital Signature | CRYSTALS-Dilithium5 | NIST Level 5 (PQ) |
| Key Exchange | X25519 + Kyber Hybrid | PQ + Classic |
| Symmetric Encryption | AES-256-GCM | 256-bit |
| Alternative Cipher | ChaCha20-Poly1305 | 256-bit |
| Hash Function | SHA3-512, BLAKE3 | 512-bit / 256-bit |
| Key Derivation | HKDF-SHA3-512 | 512-bit |

### NAT Traversal

```
Priority Order:
1. Direct (same LAN or public IP)
2. STUN + UDP Hole Punch (cone NATs)
3. Port Prediction (symmetric NAT)
4. TURN Relay (encrypted)
5. WebSocket Fallback (via signaling)
```

## Data Flow

### Message Flow

```
┌──────────┐                              ┌──────────┐
│  Alice   │                              │   Bob    │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │ 1. Encrypt (Double Ratchet + AES-GCM)   │
     │────────────────────────────────────────▶│
     │                                         │
     │ 2. P2P via WebRTC/libp2p                │
     │    (or TURN relay if needed)            │
     │                                         │
     │                                         │ 3. Decrypt
     │                                         │
```

### Call Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────┐
│  Caller │     │  Signaling  │     │  Callee  │
└────┬────┘     └──────┬──────┘     └────┬─────┘
     │                 │                  │
     │ 1. Offer        │                  │
     │────────────────▶│                  │
     │                 │ 2. Relay Offer   │
     │                 │─────────────────▶│
     │                 │                  │
     │                 │ 3. Answer        │
     │                 │◀─────────────────│
     │ 4. Relay Answer │                  │
     │◀────────────────│                  │
     │                 │                  │
     │ 5. ICE Candidates Exchange          │
     │◀──────────────────────────────────▶│
     │                 │                  │
     │ 6. Direct P2P Media (WebRTC)        │
     │◀──────────────────────────────────▶│
```

## Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

Services:
- Signaling Server (Go) - Port 8080
- API Server (Rust) - Port 8081
- TURN/STUN (coturn) - Port 3478, 5349
- PostgreSQL - Port 5432
- Redis - Port 6379
- NATS - Port 4222
- Prometheus - Port 9090
- Grafana - Port 3000

### Kubernetes (Production)

```bash
kubectl apply -f k8s/
```

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `JWT_SECRET` | Signaling | JWT signing key |
| `TURN_PASSWORD` | coturn | TURN credentials |
| `POSTGRES_PASSWORD` | PostgreSQL | Database password |
| `GRAFANA_PASSWORD` | Grafana | Admin password |

## Monitoring

### Metrics

- **Signaling**: Active connections, messages sent/received, rate limits
- **API**: Request latency, error rates, database queries
- **TURN**: Allocations, bandwidth, active relays
- **Database**: Query performance, connections, replication lag

### Dashboards

- Grafana dashboards for all services
- Prometheus alerting rules
- Distributed tracing with OpenTelemetry

## Performance Targets

| Metric | Target |
|--------|--------|
| Message latency | < 100ms |
| P2P setup time | < 3s |
| Audio latency (E2E) | < 150ms |
| Crypto operations | < 10ms |
| PQ KeyGen (Kyber-1024) | < 50ms |
| Signaling capacity | 100K connections/instance |

## License

AGPL-3.0-or-later
