import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../theme';
import { Card } from '../ui/components/Card';

export function CallAssistantScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calling Assistant</Text>
      <Text style={styles.subtitle}>
        Native system call tracking is active in the background.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Background Job Status</Text>
        <Text style={styles.cardInfo}>
          WorkManager Periodical Sync: Registered
        </Text>
        <Text style={styles.cardInfo}>Call Log Listener: Active</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardInfo}>
          Full calling session UI with call logging, follow-ups, and
          WhatsApp integration.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  cardInfo: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
