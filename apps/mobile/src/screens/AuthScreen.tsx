import React, {useState} from 'react';
import {View, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {Button, Input, Text, Avatar} from '@liberty-reach/ui';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/authStore';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: {conversationId: string};
  Settings: undefined;
  ContactSearch: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export default function AuthScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {login, isAuthenticated} = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  const handleSendCode = async () => {
    // TODO: Implement SMS verification
    setStep('code');
  };

  const handleVerifyCode = async () => {
    // TODO: Implement code verification
    await login('user-id', 'device-id');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Avatar name="LR" size="xl" />
        
        <Text variant="heading1" style={styles.title}>
          Liberty Reach
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Post-Quantum Secure Messenger
        </Text>

        {step === 'phone' ? (
          <>
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <Button
              title="Send Code"
              onPress={handleSendCode}
              disabled={phoneNumber.length < 10}
              fullWidth
            />
          </>
        ) : (
          <>
            <Input
              label="Verification Code"
              placeholder="123456"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              title="Verify"
              onPress={handleVerifyCode}
              disabled={verificationCode.length !== 6}
              fullWidth
            />
          </>
        )}

        <Text variant="caption" style={styles.footer}>
          Secured with CRYSTALS-Kyber-1024
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
  },
});
