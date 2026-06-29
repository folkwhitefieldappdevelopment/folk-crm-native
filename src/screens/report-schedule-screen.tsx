import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';

interface Props {
  route: any;
  navigation: any;
}

export function ReportScheduleScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const [enabled, setEnabled] = useState(false);
  const [reportTime, setReportTime] = useState('08:00');
  const [recipientsText, setRecipientsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupSettings();
  }, [groupId]);

  async function fetchGroupSettings() {
    try {
      const api = getApiClient();
      const response = await api.get(`/groups/${groupId}`);
      const group = response.data;
      setEnabled(group.reportingEnabled || false);
      setReportTime(group.reportTime || '08:00');
      const recipients = group.reportRecipients || [];
      setRecipientsText(
        Array.isArray(recipients) ? recipients.join(', ') : ''
      );
    } catch (err) {
      console.error('Failed to fetch group:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const api = getApiClient();
      const recipients = recipientsText
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
      await api.put(`/groups/${groupId}`, {
        reportingEnabled: enabled,
        reportTime: enabled ? reportTime : undefined,
        reportRecipients: enabled ? recipients : [],
      });
      Alert.alert('Saved', 'Report schedule updated successfully.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save schedule.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Schedule</Text>
        <Text style={styles.subtitle}>{groupName}</Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto Email Reports</Text>
            <Text style={styles.switchDesc}>
              Send daily report to recipients
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={enabled ? Colors.primary : '#f4f3f4'}
          />
        </View>

        {enabled && (
          <>
            <Text style={styles.label}>Daily Report Time</Text>
            <TextInput
              style={styles.input}
              value={reportTime}
              onChangeText={setReportTime}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Recipient Emails</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recipientsText}
              onChangeText={setRecipientsText}
              placeholder="fg@example.com, guide@example.com"
              placeholderTextColor={Colors.textLight}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={styles.hint}>
              Separate multiple emails with commas
            </Text>
          </>
        )}

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={isSaving ? 'Saving...' : 'Save Schedule'}
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
            loading={isSaving}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
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
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  switchDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  actionButton: {
    flex: 1,
  },
});
