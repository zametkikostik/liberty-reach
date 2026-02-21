import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Screens
import AuthScreen from '../screens/AuthScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import CallScreen from '../screens/CallScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ContactSearchScreen from '../screens/ContactSearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ChatTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({color}) => <>{/* Chat Icon */}</>,
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallScreen}
        options={{
          tabBarLabel: 'Calls',
          tabBarIcon: ({color}) => <>{/* Call Icon */}</>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color}) => <>{/* Profile Icon */}</>,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Main" component={ChatTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ContactSearch" component={ContactSearchScreen} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
