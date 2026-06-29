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
import { EmptyState } from '../ui/components/EmptyState';
import { getApiClient } from '../services/api-client';

interface Assignment {
  id: string;
  name: string;
  description?: string;
  task?: string;
  assignedByName?: string;
  memberCount?: number;
  expiresAt?: string | null;
}

interface Props {
  navigation: any;
}

export function AssignmentsScreen({ navigation }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const api = getApiClient();
      const response = await api.get('/groups', {
        params: { assignedToMe: true },
      });
      const groups = response.data || [];
      const withAssignments = groups.filter(
        (g: any) => g.task || g.assignedByName
      );
      setAssignments(withAssignments);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchAssignments();
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
        <Text style={styles.title}>Assignments</Text>
        <Text style={styles.subtitle}>
          Groups and tasks assigned to you
        </Text>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
            <Card style={styles.card}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.task && (
                <Text style={styles.taskText} numberOfLines={2}>
                  {item.task}
                </Text>
              )}
              <View style={styles.meta}>
                {item.assignedByName && (
                  <Text style={styles.metaText}>
                    By: {item.assignedByName}
                  </Text>
                )}
                {item.memberCount !== undefined && (
                  <Text style={styles.metaText}>
                    {item.memberCount} members
                  </Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="\uD83D\uDCCB"
            title="No Assignments"
            message="You have no pending assignments."
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
          assignments.length === 0 ? styles.emptyContainer : undefined
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
  groupName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  taskText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
  },
});
