import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { SearchBar } from '../ui/components/SearchBar';
import { Avatar } from '../ui/components/Avatar';
import { StatusBadge } from '../ui/components/StatusBadge';
import { getApiClient } from '../services/api-client';

interface Props {
  route: any;
  navigation: any;
}

export function EventCheckInScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  async function fetchMembers() {
    try {
      const api = getApiClient();
      const response = await api.get(`/groups/${groupId}`);
      const group = response.data;
      const people = (group.members || [])
        .map((m: any) => m.person)
        .filter(Boolean);
      setMembers(people);
      const attended = new Set<string>();
      people.forEach((p: any) => {
        const hasAttended = (p.attendanceHistory || []).some(
          (a: any) =>
            a.groupId === groupId &&
            new Date(a.date).toDateString() === new Date().toDateString()
        );
        if (hasAttended) attended.add(p.id);
      });
      setCheckedIn(attended);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(personId: string) {
    setCheckingIn(personId);
    try {
      const api = getApiClient();
      await api.post('/events/attendance', {
        personId,
        groupId,
        date: new Date().toISOString().split('T')[0],
      });
      setCheckedIn((prev) => new Set(prev).add(personId));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark attendance. Try again.');
    } finally {
      setCheckingIn(null);
    }
  }

  async function handleRemoveCheckIn(personId: string) {
    setCheckingIn(personId);
    try {
      const api = getApiClient();
      await api.delete('/events/attendance', {
        data: { personId, groupId, eventId: '' },
      });
      setCheckedIn((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    } catch {
      Alert.alert('Error', 'Failed to remove attendance.');
    } finally {
      setCheckingIn(null);
    }
  }

  const filtered = search
    ? members.filter((m) =>
        m.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.groupName}>{groupName}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.stats}>
          {checkedIn.size}/{members.length} checked in
        </Text>
      </Card>

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search members..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isChecked = checkedIn.has(item.id);
          const isLoading = checkingIn === item.id;
          return (
            <View style={styles.memberItem}>
              <Avatar name={item.fullName} photoUrl={item.photoUrl} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.fullName}</Text>
                <Text style={styles.memberStage}>
                  {item.currentFolkStage || '\u2014'}
                </Text>
              </View>
              {isChecked ? (
                <TouchableOpacity
                  style={[styles.checkButton, styles.checkedButton]}
                  onPress={() => handleRemoveCheckIn(item.id)}
                  disabled={isLoading}
                >
                  <Text style={[styles.checkButtonText, styles.checkedText]}>
                    {isLoading ? '...' : '\u2713'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() => handleCheckIn(item.id)}
                  disabled={isLoading}
                >
                  <Text style={styles.checkButtonText}>
                    {isLoading ? '...' : 'Check In'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No members found.</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
      />
    </View>
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
  headerCard: {
    margin: Spacing.md,
  },
  groupName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  stats: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  searchRow: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  memberStage: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  checkButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  checkedButton: {
    backgroundColor: Colors.success,
  },
  checkButtonText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  checkedText: {
    fontSize: FontSize.lg,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
