import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { useAuth } from '../contexts/auth-context';
import { useConnectivity } from '../contexts/connectivity-context';
import { getApiClient } from '../services/api-client';

interface DashboardStats {
  stats: {
    myContactsCount: number;
    totalContactsCount: number;
    myNewInRange: number;
    allNewInRange: number;
    byEnabler: Record<string, number>;
    byYear: Record<string, number>;
    byChantingCategory: Record<string, number>;
  };
}

export function HomeScreen() {
  const { user } = useAuth();
  const { isConnected } = useConnectivity();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const api = getApiClient();
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcome}>
        Welcome back, {user?.name || 'Enabler'}!
      </Text>

      {/* Connection Status */}
      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isConnected
                  ? Colors.statusActive
                  : Colors.statusDanger,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </Card>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator
          style={styles.statsLoader}
          size="large"
          color={Colors.primary}
        />
      ) : stats ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.stats.myContactsCount}
              </Text>
              <Text style={styles.statLabel}>My Contacts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.stats.totalContactsCount}
              </Text>
              <Text style={styles.statLabel}>Total Contacts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.stats.myNewInRange}
              </Text>
              <Text style={styles.statLabel}>New This Week</Text>
            </View>
          </View>

          {/* By Year */}
          {Object.keys(stats.stats.byYear).length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>By Year</Text>
              {Object.entries(stats.stats.byYear).map(
                ([year, count]) => (
                  <View key={year} style={styles.barRow}>
                    <Text style={styles.barLabel}>{year}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.min(
                              (count /
                                Math.max(
                                  ...Object.values(
                                    stats.stats.byYear
                                  )
                                )) *
                                100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                )
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionText}>
                📞 Start Calling Session
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionText}>
                ➕ Add New Contact
              </Text>
            </TouchableOpacity>
          </Card>
        </>
      ) : null}

      {/* User Info */}
      {user && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.info}>Name: {user.name}</Text>
          <Text style={styles.info}>Email: {user.email}</Text>
          <Text style={styles.info}>
            Role: {user.role?.join(', ') || '—'}
          </Text>
          {user.fgCode && (
            <Text style={styles.info}>FG Code: {user.fgCode}</Text>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  welcome: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statsLoader: {
    marginVertical: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barLabel: {
    width: 50,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.divider,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  barCount: {
    width: 40,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  quickAction: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  quickActionText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  info: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});
