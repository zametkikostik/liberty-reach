# @liberty-reach/voice

Push-to-Talk Voice Conferencing for Liberty Reach (Zello-like).

## Features

- **Push-to-Talk** - Instant voice transmission like Zello/walkie-talkie
- **Voice Conferences** - Multi-user voice channels
- **Voice Activity Detection** - Automatic speech detection
- **Audio Processing** - Echo cancellation, noise suppression, AGC
- **Low Latency** - Optimized for real-time communication
- **Connection Quality** - Real-time quality monitoring

## Installation

```bash
npm install @liberty-reach/voice
```

## Usage

### Basic Push-to-Talk

```typescript
import { PushToTalk, VoiceConference, AudioEngine } from '@liberty-reach/voice';

// Initialize audio
const audio = new AudioEngine();
await audio.initialize();

// Create conference
const conference = new VoiceConference({
  conferenceId: 'channel-1',
  maxMembers: 100,
  audioConfig: {
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
  },
  transportConfig: {},
  enableVoiceActivity: true,
  talkTimeout: 60, // 60 seconds max talk time
  idleTimeout: 300, // 5 minutes idle timeout
});

// Create PTT controller
const ptt = new PushToTalk({
  minPressDuration: 100,
  hapticFeedback: true,
  soundFeedback: true,
});

// Connect handlers
ptt.onTransmitStart(() => {
  conference.startTalking('user-1');
  audio.startCapture((samples) => {
    conference.sendVoiceFrame('user-1', {
      sequenceNumber: 0,
      timestamp: Date.now(),
      samples,
      isLastFrame: false,
    });
  });
});

ptt.onTransmitStop(() => {
  conference.stopTalking('user-1');
  audio.stopCapture();
});

// Connect to conference
await conference.connect('user-1', 'My Name');

// Handle PTT button
const pttButton = document.getElementById('ptt-button');
pttButton?.addEventListener('mousedown', () => ptt.press());
pttButton?.addEventListener('mouseup', () => ptt.release());
pttButton?.addEventListener('touchstart', () => ptt.press());
pttButton?.addEventListener('touchend', () => ptt.release());
```

### Voice Activity Detection

```typescript
import { VoiceActivityDetector } from '@liberty-reach/voice';

const vad = new VoiceActivityDetector({
  silenceThreshold: 0.02,
  minSpeechDuration: 50,
  minSilenceDuration: 200,
});

vad.onSpeech(() => {
  console.log('Speech detected - start transmitting');
});

vad.onSilence(() => {
  console.log('Silence detected - stop transmitting');
});

// Process audio samples
audio.startCapture((samples) => {
  vad.process(samples);
});
```

### Conference Events

```typescript
conference.on('member_joined', (event) => {
  console.log(`${event.memberName} joined the channel`);
});

conference.on('member_left', (event) => {
  console.log(`${event.memberId} left the channel`);
});

conference.on('talking_started', (event) => {
  console.log(`${event.memberName} is talking`);
});

conference.on('talking_stopped', (event) => {
  console.log(`${event.memberName} stopped talking`);
});

// Get conference state
const state = conference.getState();
console.log('Current speaker:', state.currentSpeaker);
console.log('Members:', state.members);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Voice Conference Server                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Client 1 │  │ Client 2 │  │ Client 3 │  │ Client 4 │   │
│  │  [PTT]   │  │  [PTT]   │  │  [PTT]   │  │  [PTT]   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴──────┬──────┴─────────────┘          │
│                            │                               │
│                   ┌────────▼────────┐                      │
│                   │  Voice Server   │                      │
│                   │  (MediaSoup)    │                      │
│                   └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘

Only one person can talk at a time (PTT)
Server broadcasts speaker's audio to all listeners
```

## API Reference

### VoiceConference

#### Configuration

```typescript
interface ConferenceConfig {
  conferenceId: string;
  maxMembers: number;
  audioConfig: AudioConfig;
  transportConfig: TransportConfig;
  enableVoiceActivity: boolean;
  enableRecording: boolean;
  talkTimeout: number; // seconds
  idleTimeout: number; // seconds
}
```

#### Methods

- `connect(memberId, memberName)` - Join conference
- `disconnect(memberId)` - Leave conference
- `startTalking(memberId)` - Start transmitting (PTT)
- `stopTalking(memberId)` - Stop transmitting
- `sendVoiceFrame(memberId, frame)` - Send audio frame
- `toggleMute(memberId)` - Mute/unmute
- `getState()` - Get conference state
- `getMembers()` - Get member list
- `on(event, handler)` - Subscribe to events

### PushToTalk

#### Configuration

```typescript
interface PTTConfig {
  minPressDuration: number; // ms
  debounceTime: number; // ms
  enableVAD: boolean;
  hapticFeedback: boolean;
  soundFeedback: boolean;
}
```

#### States

- `IDLE` - Not pressed
- `PRESSED` - Button pressed, waiting
- `TRANSMITTING` - Actively transmitting
- `RELEASED` - Button released, stopping

#### Methods

- `press()` - Press PTT button
- `release()` - Release PTT button
- `toggle()` - Toggle state
- `getState()` - Get current state
- `isTransmitting()` - Check if transmitting
- `onStateChanged(handler)` - State change handler
- `onTransmitStart(handler)` - Transmit start handler
- `onTransmitStop(handler)` - Transmit stop handler

### AudioEngine

#### Configuration

```typescript
interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
}
```

#### Methods

- `initialize()` - Initialize audio context
- `startCapture(onAudioData)` - Start microphone capture
- `stopCapture()` - Stop capture
- `startPlayback()` - Start audio playback
- `stopPlayback()` - Stop playback
- `playSamples(samples)` - Play received audio
- `setMuted(muted)` - Mute/unmute
- `setVolume(volume)` - Set volume (0-1)
- `getStats()` - Get audio statistics
- `close()` - Close audio engine

### VoiceActivityDetector

#### Configuration

```typescript
interface VADConfig {
  silenceThreshold: number; // 0-1
  minSpeechDuration: number; // ms
  minSilenceDuration: number; // ms
  smoothingFactor: number; // 0-1
}
```

#### States

- `SILENCE` - No speech detected
- `SPEECH_START` - Speech detected, confirming
- `SPEECH` - Active speech
- `SPEECH_END` - Speech ended, confirming

#### Methods

- `process(samples)` - Process audio samples
- `getState()` - Get current state
- `isSpeaking()` - Check if speaking
- `reset()` - Reset detector
- `onStateChanged(handler)` - State change handler
- `onSpeech(handler)` - Speech start handler
- `onSilence(handler)` - Speech end handler

## Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Audio Latency | < 150ms | ~100ms |
| PTT Activation | < 50ms | ~30ms |
| Voice Detection | < 100ms | ~50ms |
| Audio Quality | 48kHz/16bit | 48kHz/16bit |
| Max Conference Size | 100 | 100 |

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 14+ | Full support |
| Edge | 80+ | Full support |

## License

AGPL-3.0-or-later
