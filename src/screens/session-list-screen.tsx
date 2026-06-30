import React, { useState, useEffect, useCallback } from 'react';
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
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import { useAuth } from '../contexts/auth-context';

interface Session {
  id: string;
  name: string;
  status: string;
  current_index: number;
  createdBy: string;
  creatorName?: string;
  lastActivity?: string;
  createdAt: string;
  people?: Array<{ id: string; person?: any }>;
}

interface Props {
  navigation: any;
}

export function SessionListScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

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

  function getProgress(session: Session): string {
    const total = session.people?.length || 0;
    const current = session.current_index || 0;
    return total > 0 ? `${current}/${total}` : '—';
  }

  function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Sessions</Text>
        <Button
          title="+ New"
          onPress={() => navigation.navigate('CallAssistant')}
          variant="accent"
          style={styles.newButton}
          textStyle={styles.newButtonText}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const total = item.people?.length || 0;
            const current = item.current_index || 0;
            const progress = total > 0 ? current / total : 0;

            return (
              <TouchableOpacity
                style={styles.sessionItem}
                onPress={() =>
                  navigation.navigate('CallingSession', {
                    sessionId: item.id,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          item.status === 'active'
                            ? Colors.statusActive
                            : Colors.textLight,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress * 100, 100)}%` },
                    ]}
                  />
                </View>

                <View style={styles.sessionMeta}>
                  <Text style={styles.metaText}>
                    {getProgress(item)} contacts
                  </Text>
                  {item.lastActivity && (
                    <Text style={styles.metaText}>
                      {timeAgo(item.lastActivity)}
                    </Text>
                  )}
                </View>

                {item.creatorName && (
                  <Text style={styles.creatorText}>
                    by {item.creatorName}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No Active Sessions
              </Text>
              <Text style={styles.emptyText}>
                Start a new calling session to begin tracking your
                outreach.
              </Text>
              <Button
                title="Start New Session"
                onPress={() =>
                  navigation.navigate('CallAssistant')
                }
                variant="primary"
                style={styles.startButton}
              />
            </Card>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  newButton: {
    height: 36,
    paddingHorizontal: Spacing.lg,
  },
  newButtonText: {
    fontSize: FontSize.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
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
    marginRight: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.divider,
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  creatorText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  emptyCard: {
    margin: Spacing.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  startButton: {
    width: '100%',
  },
});
