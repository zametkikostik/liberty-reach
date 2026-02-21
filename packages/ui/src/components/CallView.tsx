/**
 * CallView Component
 * 
 * Video/audio call interface component.
 */

import React from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Avatar } from './Avatar.js';
import { Text } from './Text.js';

/**
 * Call status
 */
export type CallStatus = 'connecting' | 'connected' | 'ending' | 'missed' | 'declined';

/**
 * Call type
 */
export type CallType = 'audio' | 'video';

/**
 * CallView props
 */
export interface CallViewProps {
  /** Caller name */
  callerName: string;
  /** Caller avatar URL */
  callerAvatar?: string;
  /** Call type */
  callType?: CallType;
  /** Call status */
  callStatus?: CallStatus;
  /** Call duration in seconds */
  duration?: number;
  /** Is microphone muted */
  isMuted?: boolean;
  /** Is camera off */
  isCameraOff?: boolean;
  /** Is speaker on */
  isSpeakerOn?: boolean;
  /** On end call handler */
  onEndCall?: () => void;
  /** On toggle mute handler */
  onToggleMute?: () => void;
  /** On toggle camera handler */
  onToggleCamera?: () => void;
  /** On toggle speaker handler */
  onToggleSpeaker?: () => void;
  /** On switch camera handler */
  onSwitchCamera?: () => void;
  /** Remote video URL (for video calls) */
  remoteVideoUrl?: string;
  /** Local video URL (for video calls) */
  localVideoUrl?: string;
}

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * CallView component
 */
export const CallView: React.FC<CallViewProps> = ({
  callerName,
  callerAvatar,
  callType = 'video',
  callStatus = 'connecting',
  duration = 0,
  isMuted = false,
  isCameraOff = false,
  isSpeakerOn = false,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onSwitchCamera,
  remoteVideoUrl,
  localVideoUrl,
}) => {
  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Calling...';
      case 'connected':
        return formatDuration(duration);
      case 'ending':
        return 'Ending...';
      case 'missed':
        return 'Missed';
      case 'declined':
        return 'Declined';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Remote video / Main content */}
      <View style={styles.mainContent}>
        {callType === 'video' && remoteVideoUrl ? (
          <Image source={{ uri: remoteVideoUrl }} style={styles.remoteVideo} resizeMode="cover" />
        ) : (
          <View style={styles.callerInfo}>
            <Avatar name={callerName} imageUrl={callerAvatar} size="xxl" isOnline={callStatus === 'connected'} />
            <Text variant="heading2" style={styles.callerNameText}>
              {callerName}
            </Text>
            <Text variant="body" style={styles.statusText}>
              {getStatusText()}
            </Text>
          </View>
        )}
        
        {/* Local video preview (for video calls) */}
        {callType === 'video' && localVideoUrl && (
          <View style={styles.localVideoContainer}>
            <Image source={{ uri: localVideoUrl }} style={styles.localVideo} resizeMode="cover" />
          </View>
        )}
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        {callType === 'video' && (
          <View style={styles.videoControls}>
            <TouchableOpacity
              style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
              onPress={onToggleCamera}
            >
              <RNText style={styles.controlButtonText}>{isCameraOff ? '📷' : '📹'}</RNText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={onSwitchCamera}>
              <RNText style={styles.controlButtonText}>🔄</RNText>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.mainControls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={onToggleMute}
          >
            <RNText style={styles.controlButtonText}>{isMuted ? '🔇' : '🎤'}</RNText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.endButton} onPress={onEndCall}>
            <RNText style={styles.endButtonText}>📞</RNText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={onToggleSpeaker}
          >
            <RNText style={styles.controlButtonText}>{isSpeakerOn ? '🔊' : '🔈'}</RNText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callerInfo: {
    alignItems: 'center',
  },
  callerNameText: {
    marginTop: 16,
    color: '#FFFFFF',
  },
  statusText: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  controlButtonText: {
    fontSize: 24,
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    fontSize: 28,
  },
});
