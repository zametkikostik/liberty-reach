import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Avatar, Text, Button, StatusBar} from '@liberty-reach/ui';
import {useAuthStore} from '../store/authStore';

export default function ProfileScreen() {
  const {user, logout} = useAuthStore();

  return (
    <View style={styles.container}>
      <StatusBar title="Profile" />
      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <Avatar name={user?.displayName || 'User'} size="xl" />
          <Text variant="heading3" style={styles.name}>
            {user?.displayName || 'User'}
          </Text>
          <Text variant="caption">{user?.phoneNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="title3" style={styles.sectionTitle}>
            Security
          </Text>
          <Button title="View Safety Number" variant="tertiary" fullWidth />
          <Button title="Verify Identity" variant="tertiary" fullWidth />
        </View>

        <View style={styles.section}>
          <Text variant="title3" style={styles.sectionTitle}>
            Privacy
          </Text>
          <Button title="Blocked Contacts" variant="tertiary" fullWidth />
          <Button title="Disappearing Messages" variant="tertiary" fullWidth />
        </View>

        <View style={styles.section}>
          <Button title="Log Out" variant="danger" onPress={logout} fullWidth />
        </View>

        <Text variant="caption" style={styles.version}>
          Liberty Reach v0.1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 24,
  },
  name: {
    marginTop: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
});
