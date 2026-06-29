import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Avatar } from '../ui/components/Avatar';
import { StatusBadge } from '../ui/components/StatusBadge';
import { ProgressBar } from '../ui/components/ProgressBar';
import { getApiClient } from '../services/api-client';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  route: any;
  navigation: any;
}

export function LiveActivityDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    try {
      const api = getApiClient();
      const response = await api.get(`/calling-sessions/${sessionId}`);
      const data = response.data;
      setSession(data);
      const personList = (data.people || []).map((p: any) => p.person || p).filter(Boolean);
      setPeople(personList);
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchSession();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.sessionName}>{session.name}</Text>
        <ProgressBar
          progress={session.currentIndex}
          total={people.length}
          color={Colors.primary}
        />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{people.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {people.length - session.currentIndex}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{session.currentIndex}</Text>
            <Text style={styles.statLabel}>Called</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>
        People ({people.length})
      </Text>

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isCalled = index < (session.currentIndex || 0);
          const isCurrent = index === (session.currentIndex || 0);
          return (
            <View
              style={[
                styles.personItem,
                isCurrent && styles.currentItem,
              ]}
            >
              <Avatar name={item.fullName} photoUrl={item.photoUrl} size={40} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.fullName}</Text>
                <Text style={styles.personPhone}>{item.phone}</Text>
                {item.currentFolkStage && (
                  <StatusBadge label={item.currentFolkStage} size="sm" />
                )}
              </View>
              {isCalled && (
                <Text style={styles.calledMark}>&#10003;</Text>
              )}
              {isCurrent && (
                <Text style={styles.currentMark}>NOW</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No people in this session</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
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
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  headerCard: {
    margin: Spacing.md,
  },
  sessionName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  currentItem: {
    backgroundColor: Colors.primaryLight + '40',
  },
  personInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  personName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  personPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  calledMark: {
    fontSize: FontSize.xl,
    color: Colors.success,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  currentMark: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
});
