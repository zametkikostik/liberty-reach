/**
 * Video Calling for Liberty Reach
 * 
 * WebRTC video calls, screen sharing, video conferences.
 * 
 * @module @liberty-reach/video
 */

// Core
export { VideoClient, type VideoConfig, type VideoCallState } from './core/video-client.js';
export { VideoConference, type ConferenceRoom } from './core/video-conference.js';
export { ScreenSharer, type ShareConfig } from './core/screen-sharer.js';

// Media
export { MediaHandler, type MediaConfig } from './media/media-handler.js';
export { VideoProcessor, type VideoEffects } from './media/video-processor.js';
export { VideoQuality, type QualitySettings } from './media/video-quality.js';

// UI
export { VideoView } from './ui/video-view.js';
export { VideoControls } from './ui/video-controls.js';
export { ConferenceView } from './ui/conference-view.js';

// Types
export type {
  VideoStream,
  Participant,
  VideoStats,
  NetworkQuality,
} from './types.js';
