import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { EmptyState } from '../ui/components/EmptyState';
import { getApiClient } from '../services/api-client';
import { formatDistanceToNow } from 'date-fns';

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  performedByName: string;
  createdAt: string;
}

export function AuditLogScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
    try {
      const api = getApiClient();
      const response = await api.get('/audit', {
        params: { take: 100 },
      });
      setEntries(response.data || []);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchAudits();
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
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>
          Recent activity across the system
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryItem}>
            <View style={styles.entryDot} />
            <View style={styles.entryContent}>
              <Text style={styles.entryAction}>{item.action}</Text>
              {item.details && (
                <Text style={styles.entryDetails} numberOfLines={2}>
                  {item.details}
                </Text>
              )}
              <View style={styles.entryFooter}>
                <Text style={styles.entryUser}>
                  {item.performedByName}
                </Text>
                <Text style={styles.entryTime}>
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Audit Entries"
            message="Activity log is empty."
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
          entries.length === 0 ? styles.emptyContainer : undefined
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
  entryItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  entryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: Spacing.md,
  },
  entryContent: {
    flex: 1,
  },
  entryAction: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  entryDetails: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  entryUser: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
  },
});
