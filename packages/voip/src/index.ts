/**
 * VoIP Telephony for Liberty Reach
 * 
 * Internal phone numbers, SIP integration, offline call handling.
 * 
 * @module @liberty-reach/voip
 */

// Core
export { VoIPClient, type VoIPConfig, type CallState } from './core/voip-client.js';
export { InternalNumber, type NumberConfig } from './core/internal-number.js';
export { OfflineCallHandler, type OfflineCallConfig } from './core/offline-call-handler.js';

// SIP
export { SIPGateway, type SIPConfig } from './sip/sip-gateway.js';
export { SIPRegistrar } from './sip/sip-registrar.js';

// PSTN
export { PSTNGateway, type PSTNConfig } from './pstn/pstn-gateway.js';
export { DIDManager } from './pstn/did-manager.js';

// UI
export { DialPad } from './ui/dialpad.js';
export { CallScreen } from './ui/call-screen.js';
export { CallHistory } from './ui/call-history.js';

// Types
export type {
  PhoneNumber,
  CallRecord,
  CallLog,
  Voicemail,
  ForwardingRule,
  NumberCapabilities,
} from './types.js';
