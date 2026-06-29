import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { Card } from './Card';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { calculateGroupInsights, type IntelligenceInsights } from '../../services/intelligence-service';
import { generateGroupReportHtml } from '../../services/report-html';
import { sendEmailReport } from '../../services/mail-service';
import { useAuth } from '../../contexts/auth-context';

interface Props {
  group: any;
  people: any[];
}

export function IntelligentReportView({ group, people }: Props) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<IntelligenceInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingReport, setIsSendingReport] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, [people.length]);

  async function runAnalysis() {
    setIsLoading(true);
    try {
      const data = await calculateGroupInsights(people);
      setInsights(data);
    } catch (err) {
      console.error('Failed to calculate insights:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendFullReport() {
    if (!user) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }
    setIsSendingReport(true);
    try {
      const html = generateGroupReportHtml(group, people);
      const result = await sendEmailReport({
        to: [user.email],
        subject: `Full Group Report: ${group.name} — ${new Date().toLocaleDateString()}`,
        html,
      });
      if (result.sent) {
        Alert.alert('Sent', `Report sent to ${user.email}`);
      } else {
        Alert.alert('Error', result.reason || 'Delivery failed');
      }
    } catch {
      Alert.alert('Error', 'Failed to send report');
    } finally {
      setIsSendingReport(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing group data...</Text>
      </View>
    );
  }

  if (!insights) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Intelligence Dashboard</Text>
        <Button
          title={isSendingReport ? 'Sending...' : 'Full Report to FG'}
          onPress={handleSendFullReport}
          variant="accent"
          loading={isSendingReport}
          style={styles.reportButton}
        />
      </View>

      <View style={styles.statsRow}>
        <StatMiniCard
          title="Total Souls"
          value={insights.summary.totalMembers}
          color={Colors.primary}
        />
        <StatMiniCard
          title="Active (7d)"
          value={insights.summary.activeCount}
          color={Colors.success}
        />
        <StatMiniCard
          title="Danger Zone"
          value={insights.summary.dangerCount}
          color={Colors.error}
        />
        <StatMiniCard
          title="Pulse Rate"
          value={`${insights.summary.successRate}%`}
          color={Colors.accent}
        />
      </View>

      {insights.enablerLeaderboard.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {'\uD83C\uDFC6'} Enabler Leaderboard (7d)
          </Text>
          {insights.enablerLeaderboard.slice(0, 5).map((e, i) => (
            <View key={e.name} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>{i + 1}.</Text>
              <Text style={styles.leaderName}>{e.name}</Text>
              <Text style={styles.leaderStat}>
                {e.a1Count}A1 / {e.totalCalls}C
              </Text>
            </View>
          ))}
        </Card>
      )}

      {insights.dangerZone.length > 0 && (
        <Card style={[styles.sectionCard, styles.dangerCard] as any}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>
            {'\u26A0\uFE0F'} Danger Zone ({insights.dangerZone.length})
          </Text>
          {insights.dangerZone.slice(0, 5).map((p) => (
            <View key={p.id} style={styles.dangerRow}>
              <Text style={styles.dangerName}>{p.fullName}</Text>
              <StatusBadge
                label={p.lastCallStatus || 'No status'}
                size="sm"
              />
            </View>
          ))}
        </Card>
      )}

      {insights.starPerformers.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {'\u2B50'} Star Performers
          </Text>
          {insights.starPerformers.slice(0, 5).map((p) => (
            <View key={p.id} style={styles.starRow}>
              <Text style={styles.starName}>{p.fullName}</Text>
              <Text style={styles.starStat}>
                {p.attendanceHistory?.length || 0} check-ins
              </Text>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

function StatMiniCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <View style={[styles.miniCard, { borderTopColor: color }]}>
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  reportButton: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  miniCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniValue: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
  },
  miniLabel: {
    fontSize: 8,
    color: Colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  leaderRank: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textLight,
    width: 24,
  },
  leaderName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  leaderStat: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  dangerCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dangerName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  starName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  starStat: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.accent,
  },
});
