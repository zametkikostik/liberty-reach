import React from 'react';
import {View, StyleSheet} from 'react-native';
import {CallView, StatusBar} from '@liberty-reach/ui';

export default function CallScreen() {
  // Mock data - would come from call store in real app
  const activeCall = null;

  if (!activeCall) {
    return (
      <View style={styles.container}>
        <StatusBar title="Calls" />
        <View style={styles.emptyState}>
          <>{/* Call history list would go here */}</>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CallView
        callerName={activeCall.callerName}
        callType={activeCall.callType}
        callStatus={activeCall.status}
        duration={activeCall.duration}
        onEndCall={activeCall.endCall}
        onToggleMute={activeCall.toggleMute}
        onToggleCamera={activeCall.toggleCamera}
        onToggleSpeaker={activeCall.toggleSpeaker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
