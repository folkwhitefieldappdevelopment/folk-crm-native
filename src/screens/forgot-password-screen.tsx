import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';

interface Props {
  navigation: any;
}

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const api = getApiClient();
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
      });
      setSent(true);
      const tp = response.data?.tempPassword;
      if (tp) {
        setTempPassword(tp);
      } else {
        Alert.alert(
          'Check Your Email',
          'If the email exists, a reset link has been sent.'
        );
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Reset request failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  function handleGotTempPassword() {
    navigation.navigate('SetPassword', {
      email: email.trim(),
      tempPassword,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>

        {sent && tempPassword ? (
          <>
            <Text style={styles.infoText}>
              A temporary password has been generated:
            </Text>
            <View style={styles.tempBox}>
              <Text style={styles.tempText}>{tempPassword}</Text>
            </View>
            <Text style={styles.infoText}>
              Use this to set a new password.
            </Text>
            <Button
              title="Set New Password"
              onPress={handleGotTempPassword}
              variant="accent"
              style={styles.button}
            />
          </>
        ) : sent ? (
          <>
            <Text style={styles.infoText}>
              If an account exists with that email, a reset link has been
              sent.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.button}
            />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you password reset
              instructions.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Button
              title="Send Reset"
              onPress={handleReset}
              loading={loading}
              variant="accent"
              style={styles.button}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  tempBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  tempText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.accent,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.lg,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  linkRow: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
