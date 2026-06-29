import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import { useAuth } from '../contexts/auth-context';

interface Contact {
  id: string;
  fullName: string;
  phone?: string;
  currentFolkStage?: string;
}

interface Props {
  navigation: any;
}

export function SessionSelectContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const api = getApiClient();
      const response = await api.get('/people', {
        params: {
          take: 200,
          search: search || undefined,
        },
      });
      setContacts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStart() {
    if (selected.size === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    setCreating(true);
    try {
      const api = getApiClient();
      const sessionName = `Session - ${new Date().toLocaleDateString()} (${
        selected.size
      } contacts)`;

      const response = await api.post('/calling-sessions', {
        name: sessionName,
        peopleIds: Array.from(selected),
        createdBy: user?.id || '',
        creatorName: user?.name || '',
      });

      const session = response.data;
      navigation.replace('CallingSession', {
        sessionId: session.id,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create session';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchContacts}
          returnKeyType="search"
        />
        <Button
          title="Search"
          onPress={fetchContacts}
          variant="primary"
          style={styles.searchButton}
          textStyle={styles.searchButtonText}
        />
      </View>

      <View style={styles.selectionBar}>
        <Text style={styles.selectionText}>
          {selected.size} selected
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSel = selected.has(item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  isSel && styles.contactItemSelected,
                ]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSel && styles.checkboxSelected,
                  ]}
                >
                  {isSel && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {item.fullName}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {item.phone}
                  </Text>
                  <Text style={styles.contactStage}>
                    {item.currentFolkStage}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No contacts found
            </Text>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <Button
          title={`Start Session (${selected.size})`}
          onPress={handleStart}
          loading={creating}
          disabled={selected.size === 0}
          variant="accent"
          style={styles.startButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  searchButton: {
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  searchButtonText: {
    fontSize: FontSize.sm,
  },
  selectionBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
  },
  selectionText: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  contactItemSelected: {
    backgroundColor: '#E8EAF6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactStage: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
  bottomBar: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    height: 50,
  },
});
