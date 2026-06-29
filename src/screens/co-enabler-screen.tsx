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
import { StatusBadge } from '../ui/components/StatusBadge';
import { EmptyState } from '../ui/components/EmptyState';
import { getApiClient } from '../services/api-client';
import { formatDistanceToNow } from 'date-fns';

interface CoEnablerSession {
  id: string;
  name: string;
  task: string;
  type: 'external' | 'internal';
  expiresAt: string;
  peopleIds: string[];
  creatorName: string;
}

interface Props {
  navigation: any;
}

export function CoEnablerScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<CoEnablerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchSessions);
    return unsubscribe;
  }, [navigation]);

  async function fetchSessions() {
    try {
      const api = getApiClient();
      const response = await api.get('/co-enabler');
      setSessions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch co-enabler sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchSessions();
  }

  function isExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

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
        <Text style={styles.title}>Co-Enabler</Text>
        <Text style={styles.subtitle}>
          Assigned co-enabler sessions
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const expired = isExpired(item.expiresAt);
          return (
            <TouchableOpacity
              style={styles.sessionItem}
              onPress={() =>
                navigation.navigate('CoEnablerSession', {
                  sessionId: item.id,
                })
              }
              activeOpacity={0.7}
            >
              <Card
                style={expired ? Object.assign({}, styles.sessionCard, styles.expiredCard) : styles.sessionCard}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{item.name}</Text>
                  <StatusBadge
                    label={expired ? 'Expired' : 'Active'}
                    type={expired ? 'danger' : 'active'}
                    size="sm"
                  />
                </View>

                {item.task && (
                  <Text style={styles.taskText} numberOfLines={2}>
                    {item.task}
                  </Text>
                )}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>By: {item.creatorName}</Text>
                  <Text style={styles.metaLabel}>
                    {item.expiresAt
                      ? formatDistanceToNow(new Date(item.expiresAt), {
                          addSuffix: true,
                        })
                      : 'No expiry'}
                  </Text>
                </View>

                <Text style={styles.peopleCount}>
                  {item.peopleIds.length} contact
                  {item.peopleIds.length !== 1 ? 's' : ''}
                </Text>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="🤝"
            title="No Sessions"
            message="You haven't been assigned any co-enabler sessions yet."
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
          sessions.length === 0 ? styles.emptyContainer : undefined
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
  expiredCard: {
    opacity: 0.6,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  taskText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  peopleCount: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: 'bold',
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
});
