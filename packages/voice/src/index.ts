/**
 * Voice Conferencing - Push-to-Talk like Zello
 * 
 * @module @liberty-reach/voice
 */

// Core
export { VoiceConference, type ConferenceConfig, type ConferenceState } from './core/voice-conference.js';
export { PushToTalk, type PTState } from './core/push-to-talk.js';

// Audio
export { AudioEngine, type AudioConfig, type AudioStats } from './audio/audio-engine.js';
export { AudioProcessor, type AudioEffects } from './audio/audio-processor.js';
export { VoiceActivityDetector, type VADConfig } from './audio/voice-activity-detector.js';

// Network
export { VoiceTransport, type TransportConfig } from './network/voice-transport.js';
export { VoiceServer, type ServerConfig } from './server/voice-server.js';

// Types
export type {
  ConferenceMember,
  ConferenceEvent,
  VoiceFrame,
  ConnectionQuality,
} from './types.js';
