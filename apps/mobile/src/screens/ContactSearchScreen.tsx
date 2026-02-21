import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Input, StatusBar, Text} from '@liberty-reach/ui';
import {useNavigation} from '@react-navigation/native';

export default function ContactSearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar
        title="New Chat"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<>{/* Search Icon */}</>}
        />
      </View>
      <View style={styles.content}>
        <Text variant="body" style={styles.emptyText}>
          Search by username, phone number, or Liberty Reach ID
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
  },
});
