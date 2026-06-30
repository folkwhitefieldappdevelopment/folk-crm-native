import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import { getSupabase } from '../services/supabase-client';
import { useAuth } from '../contexts/auth-context';

interface Props {
  navigation: any;
}

export function CallAssistantScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAdminOrFg = user?.role?.some(
    (r) => r === 'Admin' || r === 'Folk Guide'
  );

  const [showDialog, setShowDialog] = useState(false);
  const [newEventInput, setNewEventInput] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [callEvents, setCallEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCallEvents();
  }, []);

  async function fetchCallEvents() {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('settings')
        .select('call_events')
        .single();
      if (data?.call_events && Array.isArray(data.call_events)) {
        setCallEvents(data.call_events);
      }
    } catch {
      // Settings table may not have row yet
    }
  }

  async function saveNewEvent(event: string) {
    const updated = [...callEvents, event];
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, call_events: updated });
      if (error) throw error;
      setCallEvents(updated);
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  }

  function handleOpenDialog() {
    setNewEventInput('');
    setSelectedEvent('');
    setShowDialog(true);
  }

  async function handleStartCalling() {
    let eventName = '';

    if (isAdminOrFg) {
      if (!newEventInput.trim() && !selectedEvent) {
        Alert.alert('Error', 'Please enter or select an event name');
        return;
      }
      eventName = selectedEvent || newEventInput.trim();
      if (newEventInput.trim() && !selectedEvent) {
        await saveNewEvent(newEventInput.trim());
      }
    } else {
      if (!selectedEvent) {
        Alert.alert('Error', 'Please select an event');
        return;
      }
      eventName = selectedEvent;
    }

    setCreating(true);
    try {
      const api = getApiClient();
      const response = await api.post('/calling-sessions', {
        name: eventName,
      });
      const sessionId = response.data?.id || response.data?._id;
      if (!sessionId) throw new Error('No session ID returned');
      setShowDialog(false);
      navigation.navigate('CallingSession', { sessionId });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to create session';
      Alert.alert('Error', msg);
    } finally {
      setCreating(false);
    }
  }

  const filteredEvents = newEventInput.trim()
    ? callEvents.filter((e) =>
        e.toLowerCase().includes(newEventInput.toLowerCase())
      )
    : callEvents;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calling Assistant</Text>
      <Text style={styles.subtitle}>
        Start a new calling session with your contacts.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Start New Session</Text>
        <Text style={styles.cardInfo}>
          Begin a new calling session by selecting an event and picking
          contacts to call.
        </Text>
        <Button
          title="Start Calling"
          onPress={handleOpenDialog}
          variant="accent"
          style={styles.startBtn}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Recent Sessions</Text>
        <Text style={styles.cardInfo}>
          View your recent and ongoing calling sessions from the Sessions tab.
        </Text>
      </Card>

      {/* Event Name Dialog */}
      <Modal
        visible={showDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDialog(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Event Name</Text>
            <Text style={styles.dialogSubtitle}>
              {isAdminOrFg
                ? 'Enter a new event name or select from existing ones'
                : 'Select an event from the list'}
            </Text>

            {isAdminOrFg && (
              <TextInput
                style={styles.dialogInput}
                value={newEventInput}
                onChangeText={(text) => {
                  setNewEventInput(text);
                  setSelectedEvent('');
                }}
                placeholder="Type event name..."
                placeholderTextColor="#888"
                autoFocus
              />
            )}

            {isAdminOrFg && newEventInput.trim().length > 0 ? (
              <View style={styles.eventList}>
                <Text style={styles.eventListLabel}>Matching events:</Text>
                {filteredEvents.map((ev) => (
                  <TouchableOpacity
                    key={ev}
                    style={[
                      styles.eventItem,
                      selectedEvent === ev && styles.eventItemActive,
                    ]}
                    onPress={() => {
                      setSelectedEvent(ev);
                      setNewEventInput(ev);
                    }}
                  >
                    <Text
                      style={[
                        styles.eventItemText,
                        selectedEvent === ev && styles.eventItemTextActive,
                      ]}
                    >
                      {ev}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : !isAdminOrFg ? (
              <ScrollView style={styles.eventList}>
                {callEvents.length === 0 ? (
                  <Text style={styles.noEventsText}>
                    No predefined events. Contact your Folk Guide.
                  </Text>
                ) : (
                  callEvents.map((ev) => (
                    <TouchableOpacity
                      key={ev}
                      style={[
                        styles.eventItem,
                        selectedEvent === ev && styles.eventItemActive,
                      ]}
                      onPress={() => setSelectedEvent(ev)}
                    >
                      <Text
                        style={[
                          styles.eventItemText,
                          selectedEvent === ev && styles.eventItemTextActive,
                        ]}
                      >
                        {ev}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            ) : null}

            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                onPress={() => setShowDialog(false)}
                variant="outline"
                style={styles.dialogBtn}
              />
              <Button
                title="Start"
                onPress={handleStartCalling}
                loading={creating}
                variant="primary"
                style={styles.dialogBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.md,
  },
  startBtn: {
    height: 48,
  },
  // Dialog
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  dialogTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  dialogSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  dialogInput: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  eventList: {
    maxHeight: 200,
    marginBottom: Spacing.lg,
  },
  eventListLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  eventItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  eventItemText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eventItemTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
  },
  noEventsText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dialogBtn: {
    flex: 1,
    height: 44,
  },
});
