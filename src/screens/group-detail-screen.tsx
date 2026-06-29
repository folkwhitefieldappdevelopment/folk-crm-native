import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { Avatar } from '../ui/components/Avatar';
import { IntelligentReportView } from '../ui/components/IntelligentReportView';
import { getApiClient } from '../services/api-client';

interface Group {
  id: string;
  name: string;
  description?: string;
  createdByName?: string;
  _count?: { members: number };
  reportingEnabled?: boolean;
  reportTime?: string;
  members?: Array<{
    id: string;
    person?: {
      id: string;
      fullName: string;
      phone?: string;
      currentFolkStage?: string;
      location?: string;
    };
  }>;
}

interface Props {
  route: any;
  navigation: any;
}

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const api = getApiClient();
      const response = await api.get(`/groups/${groupId}`);
      const data = response.data;
      setGroup(data);
      const memberPeople = (data.members || [])
        .map((m: any) => m.person)
        .filter(Boolean);
      setPeople(memberPeople);
    } catch (err) {
      console.error('Failed to fetch group:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  function handleRefresh() {
    setRefreshing(true);
    fetchGroup();
  }

  function getMembers() {
    if (!group?.members) return [];
    return group.members
      .map((m) => m.person)
      .filter(Boolean) as NonNullable<
      (typeof group.members)[0]['person']
    >[];
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  const members = getMembers();

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <Card style={styles.infoCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              {group.description && (
                <Text style={styles.groupDesc}>{group.description}</Text>
              )}
              {group.createdByName && (
                <Text style={styles.groupMeta}>
                  Created by {group.createdByName}
                </Text>
              )}
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{members.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionChip}
                  onPress={() =>
                    navigation.navigate('ReportSchedule', {
                      groupId: group.id,
                      groupName: group.name,
                    })
                  }
                >
                  <Text style={styles.actionChipText}>
                    {'\uD83D\uDCE7'} Schedule
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionChip,
                    showIntelligence && styles.actionChipActive,
                  ]}
                  onPress={() => setShowIntelligence(!showIntelligence)}
                >
                  <Text
                    style={[
                      styles.actionChipText,
                      showIntelligence && styles.actionChipTextActive,
                    ]}
                  >
                    {'\uD83E\uDDE0'} AI Report
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {showIntelligence && people.length > 0 && (
              <View style={styles.intelSection}>
                <IntelligentReportView group={group} people={people} />
              </View>
            )}

            <Text style={styles.sectionTitle}>
              Members ({members.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memberItem}
            onPress={() =>
              navigation.navigate('ContactDetail', {
                personId: item.id,
              })
            }
            activeOpacity={0.7}
          >
            <Avatar name={item.fullName} photoUrl={(item as any).photoUrl} size={40} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.fullName}</Text>
              <Text style={styles.memberPhone}>
                {item.phone || '\u2014'}
              </Text>
              <Text style={styles.memberStage}>
                {item.currentFolkStage}
              </Text>
            </View>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No members in this group</Text>
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
  infoCard: {
    margin: Spacing.md,
  },
  groupName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  groupDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  groupMeta: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
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
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  actionChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  actionChipActive: {
    backgroundColor: Colors.primary,
  },
  actionChipText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  actionChipTextActive: {
    color: Colors.textOnPrimary,
  },
  intelSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
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
  memberPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  memberStage: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
});
