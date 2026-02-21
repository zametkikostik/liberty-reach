# Liberty Reach Developer Guide

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Rust** >= 1.75.0 (for desktop and API server)
- **Go** >= 1.21 (for signaling server)
- **Xcode** >= 15.0 (for iOS)
- **Android Studio** >= 2023.1 (for Android)
- **Docker** >= 24.0 (for local development)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/liberty-reach/liberty-reach.git
cd liberty-reach

# Install root dependencies
npm install

# Install Rust toolchain
rustup install 1.75

# Install Go dependencies
cd server/signaling && go mod download
```

### Development Environment

```bash
# Start all backend services
docker-compose up -d

# Run mobile app (development)
npm run dev --filter=mobile

# Run desktop app (development)
npm run dev --filter=desktop

# Run web app (development)
npm run dev --filter=web
```

## Project Structure

```
liberty-reach/
├── apps/                    # Applications
│   ├── mobile/             # React Native (iOS + Android)
│   ├── desktop/            # Tauri v2 (Windows, macOS, Linux)
│   └── web/                # Next.js 14 (PWA)
│
├── packages/               # Shared packages
│   ├── crypto/            # Post-quantum cryptography
│   ├── p2p/               # WebRTC + libp2p
│   ├── protocol/          # LRP message format
│   ├── ui/                # Shared UI components
│   ├── storage/           # Encrypted storage
│   └── notifications/     # Push notifications
│
├── server/                # Backend services
│   ├── signaling/         # Go WebSocket server
│   ├── relay/             # TURN relay (coturn)
│   └── api/               # Rust/Axum API gateway
│
├── monitoring/            # Observability
│   ├── prometheus.yml
│   └── grafana/
│
└── docker-compose.yml     # Local development
```

## Common Tasks

### Running Tests

```bash
# All tests
npm run test

# Crypto tests with coverage
npm run test:coverage --filter=crypto

# Rust server tests
cd server/api && cargo test

# Go signaling tests
cd server/signaling && go test -v ./...
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --filter=crypto

# Build mobile app
cd apps/mobile && npm run build

# Build desktop app
cd apps/desktop && npm run build

# Build Docker images
docker-compose build
```

### Linting and Formatting

```bash
# Lint all
npm run lint

# Format code
npm run format

# Rust linting
cd server/api && cargo clippy

# Go linting
cd server/signaling && golangci-lint run
```

## Mobile Development

### iOS

```bash
cd apps/mobile

# Install pods
cd ios && pod install && cd ..

# Run on simulator
npm run ios

# Run on device
npm run ios:device

# Build for release
npm run ios:release
```

### Android

```bash
cd apps/mobile

# Run on emulator
npm run android

# Run on device
npm run android:device

# Build APK
npm run android:apk

# Build AAB (for Play Store)
npm run android:aab
```

## Desktop Development

```bash
cd apps/desktop

# Run in development
npm run dev

# Build for current platform
npm run build

# Build for all platforms
npm run build:all
```

## Server Development

### Signaling Server (Go)

```bash
cd server/signaling

# Run with hot reload
air

# Run tests
go test -v ./...

# Build
go build -o signaling-server .

# Run with Docker
docker-compose up signaling
```

### API Server (Rust)

```bash
cd server/api

# Run with hot reload
cargo watch -x run

# Run tests
cargo test

# Build release
cargo build --release

# Run with Docker
docker-compose up api
```

## Debugging

### React Native

```bash
# Open React DevTools
npx react-devtools

# Open Flipper
npx flipper
```

### Tauri

```bash
# Open DevTools (in development)
Cmd+Option+I (macOS)
Ctrl+Shift+I (Windows/Linux)
```

### Web

```bash
# Open DevTools
F12 or Cmd+Option+I

# Run Lighthouse audit
npm run lighthouse
```

## Contributing

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and write tests
3. Run `npm run lint` and `npm run test`
4. Submit PR with description of changes
5. Wait for code review

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Review Guidelines

- Follow existing code style
- Add tests for new functionality
- Update documentation
- Keep PRs small and focused
- Respond to feedback promptly

## Security

### Reporting Vulnerabilities

Report security issues to security@libertyreach.io

### Security Best Practices

- Never commit secrets or keys
- Use environment variables for configuration
- Enable 2FA for all accounts
- Review dependencies regularly
- Run `npm audit` and `cargo audit`

## Troubleshooting

### Common Issues

**npm install fails**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Rust build fails**
```bash
rustup update
cargo clean
```

**Go build fails**
```bash
go clean -modcache
go mod download
```

**Docker issues**
```bash
docker-compose down -v
docker-compose up -d
```

## Resources

- [Documentation](https://docs.libertyreach.io)
- [API Reference](https://api.libertyreach.io/docs)
- [Community Discord](https://discord.gg/libertyreach)
- [Issue Tracker](https://github.com/liberty-reach/liberty-reach/issues)

## License

AGPL-3.0-or-later
