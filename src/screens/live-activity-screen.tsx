import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { ProgressBar } from '../ui/components/ProgressBar';
import { EmptyState } from '../ui/components/EmptyState';
import { getApiClient } from '../services/api-client';
import { formatDistanceToNow } from 'date-fns';

interface CallingSession {
  id: string;
  name: string;
  peopleIds: string[];
  currentIndex: number;
  status: 'active' | 'completed';
  creatorName: string;
  lastActivity: string;
  createdAt: string;
}

interface Props {
  navigation: any;
}

export function LiveActivityScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<CallingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchSessions);
    return unsubscribe;
  }, [navigation]);

  async function fetchSessions() {
    try {
      const api = getApiClient();
      const response = await api.get('/calling-sessions', {
        params: { scope: 'mine' },
      });
      setSessions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchSessions();
  }

  const activeSessions = sessions.filter((s) => s.status === 'active');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Activity</Text>
        <Text style={styles.subtitle}>
          {activeSessions.length} active session
          {activeSessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={activeSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const progress = item.peopleIds.length > 0
            ? item.currentIndex / item.peopleIds.length
            : 0;
          return (
            <TouchableOpacity
              style={styles.sessionItem}
              onPress={() =>
                navigation.navigate('LiveActivityDetail', {
                  sessionId: item.id,
                })
              }
              activeOpacity={0.7}
            >
              <Card style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{item.name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>

                <ProgressBar
                  progress={item.currentIndex}
                  total={item.peopleIds.length}
                  color={Colors.success}
                  height={6}
                />

                <View style={styles.sessionMeta}>
                  <Text style={styles.metaText}>
                    {item.creatorName}
                  </Text>
                  <Text style={styles.metaText}>
                    {item.lastActivity
                      ? formatDistanceToNow(new Date(item.lastActivity), {
                          addSuffix: true,
                        })
                      : 'Just now'}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No Active Sessions"
            message="Start a calling session to see live activity here."
            actionLabel="New Session"
            onAction={() => navigation.navigate('SelectContacts')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={
          activeSessions.length === 0 ? styles.emptyContainer : undefined
        }
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
  sessionItem: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sessionCard: {
    padding: Spacing.lg,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sessionName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.success,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
  },
});
