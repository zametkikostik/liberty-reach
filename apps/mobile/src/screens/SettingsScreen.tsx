import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, StatusBar, Button} from '@liberty-reach/ui';
import {useNavigation} from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar
        title="Settings"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text variant="title3">Account</Text>
          <Button title="Phone Number" variant="ghost" fullWidth />
          <Button title="Privacy" variant="ghost" fullWidth />
          <Button title="Security" variant="ghost" fullWidth />
        </View>

        <View style={styles.section}>
          <Text variant="title3">Chats</Text>
          <Button title="Theme" variant="ghost" fullWidth />
          <Button title="Notifications" variant="ghost" fullWidth />
          <Button title="Data and Storage" variant="ghost" fullWidth />
        </View>

        <View style={styles.section}>
          <Text variant="title3">Support</Text>
          <Button title="FAQ" variant="ghost" fullWidth />
          <Button title="Contact Us" variant="ghost" fullWidth />
          <Button title="Privacy Policy" variant="ghost" fullWidth />
        </View>

        <View style={styles.section}>
          <Text variant="caption" style={styles.info}>
            End-to-end encryption with CRYSTALS-Kyber-1024
          </Text>
        </View>
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  info: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 16,
  },
});
