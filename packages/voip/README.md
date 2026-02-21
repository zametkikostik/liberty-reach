# @liberty-reach/voip

VoIP Telephony for Liberty Reach — Internal numbers, PSTN integration, and offline call handling.

## Features

- **Internal Numbers** - SIP extensions (e.g., 1001, 2002)
- **PSTN Integration** - Call regular phone numbers
- **Offline Calls** - Voicemail, call queuing, callback requests
- **SIP Protocol** - Full SIP support via WebSocket
- **Call Management** - Hold, transfer, conference, forwarding
- **Voicemail** - Record and transcribe voicemails
- **Dial Pad** - DTMF tones during calls
- **Call History** - Missed, incoming, outgoing calls

## Installation

```bash
npm install @liberty-reach/voip
```

## Usage

### Basic VoIP Call

```typescript
import { VoIPClient } from '@liberty-reach/voip';

const voip = new VoIPClient({
  sipServer: 'sip.libertyreach.io',
  wsUrl: 'wss://sip.libertyreach.io/ws',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
});

await voip.initialize();
await voip.registerNumber('1001', 'password');

// Make call
await voip.call('1002');

// Accept incoming call
voip.onIncomingCall((call) => {
  console.log('Incoming call from:', call.from);
  call.accept();
});
```

### Internal Number Management

```typescript
import { InternalNumber } from '@liberty-reach/voip';

const numbers = new InternalNumber({
  extensionLength: 4,
  prefix: '2',
});

// Assign extension to user
const extension = numbers.assignExtension('user-123', 'John Doe');
console.log('Extension:', extension); // e.g., "2001"

// Search extensions
const results = numbers.searchExtensions('John');

// Check if user is online (registered)
const isOnline = numbers.isExtensionRegistered('2001');
```

### Offline Call Handling

```typescript
import { OfflineCallHandler } from '@liberty-reach/voip';

const offlineHandler = new OfflineCallHandler({
  enableVoicemail: true,
  enableQueuing: true,
  enableCallback: true,
});

// Handle call when user is offline
await offlineHandler.handleOfflineCall(
  'call-123',
  '+1234567890',
  'Jane Doe',
  'offline'
);

// Record voicemail
const voicemail = await offlineHandler.recordVoicemail(
  'call-123',
  '+1234567890',
  'Jane Doe',
  audioStream
);

// Get queued calls
const queued = offlineHandler.getQueuedCalls();
```

### PSTN Gateway

```typescript
import { PSTNGateway, DIDManager } from '@liberty-reach/voip';

const pstn = new PSTNGateway({
  provider: 'twilio',
  credentials: {
    username: 'ACxxxx',
    password: 'secret',
    realm: 'twilio.com',
  },
  didNumbers: ['+15551234567'],
});

await pstn.connect();

// Make outbound PSTN call
const call = await pstn.makeOutboundCall('1001', '+15559876543');

// Get available DID numbers
const didManager = new DIDManager();
const available = didManager.searchDIDs({
  country: 'US',
  type: 'local',
});
```

### UI Components

```typescript
import { DialPad, CallScreen, CallHistory } from '@liberty-reach/voip';

// Dial pad
<DialPad
  onCall={(number) => voip.call(number)}
  onBackspace={() => {}}
  onClear={() => {}}
/>

// Call screen
<CallScreen
  state={voip.getState()}
  from={callerId}
  duration={callDuration}
  onAccept={() => voip.acceptCall(callId)}
  onReject={() => voip.rejectCall(callId)}
  onEnd={() => voip.endCall()}
  onMute={(muted) => voip.toggleMute()}
/>

// Call history
<CallHistory
  calls={callLogs}
  onCall={(number) => voip.call(number)}
  onVideoCall={(number) => {}}
  onDelete={(id) => {}}
/>
```

## Internal Number Format

Internal numbers follow this format:
- **Extension**: 4 digits (e.g., 1001, 2002)
- **Full Number**: +Country-Code-Extension (e.g., +1-555-1001)

## Call States

```
IDLE → DIALING → RINGING → IN_CALL → ENDED
                    ↓
                 REJECTED

IN_CALL → ON_HOLD → IN_CALL
         ↓
    TRANSFERRING
```

## API Reference

### VoIPClient

#### Methods
- `initialize()` - Initialize VoIP client
- `registerNumber(extension, password)` - Register extension
- `call(destination)` - Make outgoing call
- `acceptCall(callId)` - Accept incoming call
- `rejectCall(callId)` - Reject incoming call
- `endCall()` - End current call
- `holdCall()` - Put call on hold
- `resumeCall()` - Resume from hold
- `transferCall(target)` - Transfer call
- `sendDTMF(tone)` - Send DTMF tone
- `toggleMute()` - Toggle mute
- `getState()` - Get current state

### InternalNumber

#### Methods
- `generateExtension()` - Generate available extension
- `assignExtension(userId, displayName)` - Assign to user
- `releaseExtension(extension)` - Release extension
- `registerExtension(extension)` - Mark as online
- `unregisterExtension(extension)` - Mark as offline
- `isExtensionRegistered(extension)` - Check if online
- `searchExtensions(query)` - Search by name/number

### OfflineCallHandler

#### Methods
- `handleOfflineCall(callId, from, reason)` - Handle missed call
- `recordVoicemail(callId, from, audioStream)` - Record voicemail
- `requestCallback(from, time)` - Schedule callback
- `getQueuedCalls()` - Get queued calls
- `getVoicemails()` - Get voicemails
- `markVoicemailRead(id)` - Mark as read
- `deleteVoicemail(id)` - Delete voicemail

### PSTNGateway

#### Methods
- `connect()` - Connect to provider
- `disconnect()` - Disconnect
- `makeOutboundCall(from, to)` - Make PSTN call
- `handleInboundCall(did, from)` - Handle inbound
- `getAvailableDIDs()` - Get DID numbers
- `getCallRate(destination)` - Get call rate
- `getBalance()` - Get account balance

## SIP Configuration

```typescript
const config = {
  domain: 'libertyreach.io',
  proxy: 'sip.libertyreach.io',
  wsUrl: 'wss://sip.libertyreach.io/ws',
  registrationExpiry: 3600, // 1 hour
  enableTls: true,
  enableSrtp: true, // Secure RTP
};
```

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 14+ | Full support |
| Edge | 80+ | Full support |

## License

AGPL-3.0-or-later
