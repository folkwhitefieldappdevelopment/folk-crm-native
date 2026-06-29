import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { useAuth } from '../../contexts/auth-context';
import { getApiClient } from '../../services/api-client';
import * as Notifications from 'expo-notifications';

interface ReminderPerson {
  id: string;
  fullName: string;
  phone: string;
  photoUrl?: string;
  lastCallRemark?: string;
  nextFollowUpAt?: string;
  reminderSetName?: string;
}

export function ReminderManager() {
  const { user } = useAuth();
  const [activeAlarm, setActiveAlarm] = useState<ReminderPerson | null>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        const api = getApiClient();
        const response = await api.get('/people', {
          params: { take: 200 },
        });
        const people = response.data || [];
        const now = new Date();

        people.forEach((person: any) => {
          if (!person.nextFollowUpAt) return;
          const reminderTime = new Date(person.nextFollowUpAt);
          const reminderId = `${person.id}-${person.nextFollowUpAt}`;

          if (reminderTime <= now && !processedRef.current.has(reminderId)) {
            const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
            if (reminderTime >= thirtyMinsAgo) {
              setActiveAlarm(person);
              startPulse();
            }
            processedRef.current.add(reminderId);
          }
        });
      } catch (err) {
        console.error('Reminder check failed:', err);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Set up notification handler for when alarm fires in background
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const personId = response.notification.request.content.data?.personId;
        if (personId) {
          // Navigation handled in App.tsx or navigator
        }
      }
    );
    return () => subscription.remove();
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 10 }
    ).start();
  }

  function stopAlarm() {
    pulseAnim.setValue(1);
    setActiveAlarm(null);
  }

  function handleCall() {
    if (activeAlarm?.phone) {
      Linking.openURL(`tel:${activeAlarm.phone}`);
    }
    stopAlarm();
  }

  async function handleDismiss() {
    if (!activeAlarm || !user) return;
    try {
      const api = getApiClient();
      await api.put(`/people/${activeAlarm.id}`, {
        nextFollowUpAt: '',
        reminderSetName: '',
      });
    } catch {}
    stopAlarm();
  }

  async function handleSnooze() {
    if (!activeAlarm || !user) return;
    const snoozeTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    try {
      const api = getApiClient();
      await api.put(`/people/${activeAlarm.id}`, {
        nextFollowUpAt: snoozeTime,
        reminderSetName: user.name,
      });
    } catch {}
    stopAlarm();
  }

  if (!activeAlarm) return null;

  return (
    <Modal visible={!!activeAlarm} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Animated.View
            style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={styles.bellIcon}>{'\uD83D\uDD14'}</Text>
          </Animated.View>

          <Text style={styles.title}>FOLLOW-UP DUE</Text>
          <Text style={styles.subtitle}>Scheduled outreach task</Text>

          <View style={styles.profileCard}>
            <Avatar
              name={activeAlarm.fullName}
              photoUrl={activeAlarm.photoUrl}
              size={80}
            />
            <Text style={styles.name}>{activeAlarm.fullName}</Text>
            <Text style={styles.phone}>{activeAlarm.phone}</Text>

            {activeAlarm.lastCallRemark && (
              <View style={styles.remarkContainer}>
                <Text style={styles.remarkLabel}>Latest Context</Text>
                <Text style={styles.remarkText}>
                  "{activeAlarm.lastCallRemark}"
                </Text>
              </View>
            )}

            {activeAlarm.reminderSetName && (
              <Text style={styles.setBy}>
                Set by: {activeAlarm.reminderSetName}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="MAKE THE CALL"
              onPress={handleCall}
              variant="accent"
              style={styles.callButton}
            />
            <View style={styles.secondaryActions}>
              <Button
                title="Snooze 10m"
                onPress={handleSnooze}
                variant="outline"
                style={styles.smallButton}
              />
              <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    backgroundColor: '#1e1e2e',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  profileCard: {
    backgroundColor: '#161623',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  phone: {
    fontSize: FontSize.md,
    color: Colors.accent,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  remarkContainer: {
    backgroundColor: '#2a2a3e',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
  },
  remarkLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  remarkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  setBy: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  callButton: {
    width: '100%',
    height: 56,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallButton: {
    flex: 1,
    height: 44,
  },
  dismissBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.error,
  },
});
