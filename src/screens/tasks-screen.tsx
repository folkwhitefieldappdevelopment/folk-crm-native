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
import { format } from 'date-fns';

interface TaskGroup {
  id: string;
  name: string;
  task?: string;
  assignedByName?: string;
  assignedToName?: string;
  expiresAt?: string;
  memberCount?: number;
}

interface Props {
  navigation: any;
}

export function TasksScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const api = getApiClient();
      const response = await api.get('/groups', {
        params: { hasTask: true },
      });
      const groups = response.data || [];
      const withTasks = groups.filter((g: any) => g.task);
      setTasks(withTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchTasks();
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
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>
          Group tasks and follow-ups
        </Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const expired =
            item.expiresAt && new Date(item.expiresAt) < new Date();
          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('GroupDetail', {
                  groupId: item.id,
                  groupName: item.name,
                })
              }
              activeOpacity={0.7}
            >
              <Card style={expired ? Object.assign({}, styles.card, styles.expiredCard) : styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {expired && (
                    <StatusBadge label="Overdue" type="danger" size="sm" />
                  )}
                </View>
                {item.task && (
                  <Text style={styles.taskText} numberOfLines={3}>
                    {item.task}
                  </Text>
                )}
                <View style={styles.metaRow}>
                  {item.assignedByName && (
                    <Text style={styles.metaText}>
                      Assigned by: {item.assignedByName}
                    </Text>
                  )}
                  {item.memberCount && (
                    <Text style={styles.metaText}>
                      {item.memberCount} members
                    </Text>
                  )}
                </View>
                {item.expiresAt && (
                  <Text style={styles.dueDate}>
                    Due: {format(new Date(item.expiresAt), 'MMM d, yyyy')}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="\u2705"
            title="No Tasks"
            message="No group tasks assigned."
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
          tasks.length === 0 ? styles.emptyContainer : undefined
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
  item: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
  },
  expiredCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  taskText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  dueDate: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: 'bold',
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
});
