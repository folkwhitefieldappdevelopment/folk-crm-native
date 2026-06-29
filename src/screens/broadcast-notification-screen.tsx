import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { useAuth } from '../contexts/auth-context';
import { broadcastNotification } from '../services/notification-service';

const ROLES = ['Admin', 'Folk Guide', 'Folk Enabler'];

export function BroadcastNotificationScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Folk Guide', 'Folk Enabler']);
  const [isSending, setIsSending] = useState(false);

  function handleToggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  }

  async function handleSend() {
    if (!user) return;
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required.');
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert('Error', 'Select at least one target group.');
      return;
    }

    setIsSending(true);
    try {
      await broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        targetRoles: selectedRoles,
        senderId: user.id,
        senderName: user.name,
      });
      Alert.alert(
        'Sent',
        `Broadcasted to ${selectedRoles.join(', ')}.`
      );
      setTitle('');
      setMessage('');
    } catch (err) {
      Alert.alert('Error', 'Failed to send notification.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Broadcast Notification</Text>
        <Text style={styles.subtitle}>
          Send a notification to specific user groups
        </Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.label}>Notification Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Important Update"
          placeholderTextColor={Colors.textLight}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your message..."
          placeholderTextColor={Colors.textLight}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Target Groups</Text>
        <View style={styles.roleList}>
          {ROLES.map((role) => {
            const isSelected = selectedRoles.includes(role);
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleItem,
                  isSelected && styles.roleItemSelected,
                ]}
                onPress={() => handleToggleRole(role)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleText,
                    isSelected && styles.roleTextSelected,
                  ]}
                >
                  {role}s
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={isSending ? 'Sending...' : 'Send Broadcast'}
          onPress={handleSend}
          variant="accent"
          loading={isSending}
          style={styles.sendButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  roleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  sendButton: {
    marginTop: Spacing.xxl,
  },
});
