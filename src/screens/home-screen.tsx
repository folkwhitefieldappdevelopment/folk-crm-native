import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { useAuth } from '../contexts/auth-context';
import { useConnectivity } from '../contexts/connectivity-context';
import { getSupabase } from '../services/supabase-client';

type DatePreset = 'today' | '7days' | '30days' | 'custom';

type CallStatusBreakdown = {
  status: string;
  count: number;
};

type EventBreakdown = {
  event: string;
  total: number;
  statuses: CallStatusBreakdown[];
};

type SourceBreakdown = {
  source: string;
  count: number;
};

type EnablerBreakdown = {
  enablerId: string;
  enablerName: string;
  sg: number;
  sixteen: number;
  frp: number;
};

const ELIMINATED_STATUSES = [
  'A2 - Not Interested',
  'A3 - Wrong Number',
  'G - Completely Shifted to Another city',
];

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;

  switch (preset) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return { from: from.toISOString(), to };
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isConnected } = useConnectivity();
  const userId = user?.id;

  // Stats
  const [myContactsCount, setMyContactsCount] = useState(0);
  const [totalContactsCount, setTotalContactsCount] = useState(0);

  // Source breakdown
  const [mySources, setMySources] = useState<SourceBreakdown[]>([]);
  const [allSources, setAllSources] = useState<SourceBreakdown[]>([]);

  // Call status
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);

  // SG / 16-round / FRP breakdown
  const [enablerBreakdown, setEnablerBreakdown] = useState<EnablerBreakdown[]>([]);
  const [sgTotal, setSgTotal] = useState(0);
  const [sixteenTotal, setSixteenTotal] = useState(0);
  const [frpTotal, setFrpTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { from, to } = getDateRange(datePreset);

      // --- Contact counts ---
      const { count: totalCount } = await supabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      let myQuery = supabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);
      if (userId) myQuery = myQuery.eq('enabler_id', userId);
      const { count: my } = await myQuery;

      setTotalContactsCount(totalCount || 0);
      setMyContactsCount(my || 0);

      // --- Source breakdown + SG/16/FRP breakdown ---
      const { data: allPeople } = await supabase
        .from('people')
        .select('enabler_id, contact_source, is_sg, chanting_status, current_folk_stage')
        .eq('is_deleted', false);

      const myPeople = allPeople?.filter((p: any) => p.enabler_id === userId) || [];
      const allSrcMap: Record<string, number> = {};
      const mySrcMap: Record<string, number> = {};

      (allPeople || []).forEach((p: any) => {
        let sources: string[] = [];
        try {
          const raw = p.contact_source;
          if (typeof raw === 'string') {
            sources = JSON.parse(raw);
          } else if (Array.isArray(raw)) {
            sources = raw;
          }
        } catch { sources = []; }
        if (sources.length === 0) sources = ['Uncategorised'];
        sources.forEach((s: string) => {
          allSrcMap[s] = (allSrcMap[s] || 0) + 1;
        });
      });

      myPeople.forEach((p: any) => {
        let sources: string[] = [];
        try {
          const raw = p.contact_source;
          if (typeof raw === 'string') {
            sources = JSON.parse(raw);
          } else if (Array.isArray(raw)) {
            sources = raw;
          }
        } catch { sources = []; }
        if (sources.length === 0) sources = ['Uncategorised'];
        sources.forEach((s: string) => {
          mySrcMap[s] = (mySrcMap[s] || 0) + 1;
        });
      });

      setAllSources(
        Object.entries(allSrcMap)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
      );
      setMySources(
        Object.entries(mySrcMap)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
      );

      // --- SG / 16-round / FRP enabler breakdown ---
      const eMap: Record<string, { sg: number; sixteen: number; frp: number }> = {};
      let sTotal = 0, sixTotal = 0, fTotal = 0;

      (allPeople || []).forEach((p: any) => {
        const eid = p.enabler_id || 'unassigned';
        if (!eMap[eid]) eMap[eid] = { sg: 0, sixteen: 0, frp: 0 };
        if (p.is_sg) { eMap[eid].sg++; sTotal++; }
        if ((p.chanting_status || 0) >= 16) { eMap[eid].sixteen++; sixTotal++; }
        if (p.current_folk_stage === 'FRP') { eMap[eid].frp++; fTotal++; }
      });

      setSgTotal(sTotal);
      setSixteenTotal(sixTotal);
      setFrpTotal(fTotal);

      const enablerIds = Object.keys(eMap).filter(id => id !== 'unassigned');
      let enablerNameMap: Record<string, string> = {};
      if (enablerIds.length > 0) {
        const { data: enablerUsers } = await supabase
          .from('users')
          .select('id, name')
          .in('id', enablerIds);
        (enablerUsers || []).forEach((u: any) => { enablerNameMap[u.id] = u.name; });
      }
      enablerNameMap['unassigned'] = 'Unassigned';

      setEnablerBreakdown(
        Object.entries(eMap)
          .map(([eid, counts]) => ({
            enablerId: eid === 'unassigned' ? '' : eid,
            enablerName: enablerNameMap[eid] || 'Unknown',
            ...counts,
          }))
          .sort((a, b) => (b.sg + b.sixteen + b.frp) - (a.sg + a.sixteen + a.frp))
      );

      // --- Call logs by event & status ---
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('status, event, person:people!inner(enabler_id)')
        .gte('called_at', from)
        .lte('called_at', to);

      const myLogs = userId
        ? (callLogs || []).filter((l: any) => l.person?.enabler_id === userId)
        : (callLogs || []);

      const eventMap: Record<string, Record<string, number>> = {};
      let callTotal = 0;
      (myLogs || []).forEach((l: any) => {
        const ev = l.event || 'Without Event';
        const st = l.status || 'Unknown';
        if (!eventMap[ev]) eventMap[ev] = {};
        eventMap[ev][st] = (eventMap[ev][st] || 0) + 1;
        callTotal++;
      });

      setTotalCalls(callTotal);
      setEventBreakdown(
        Object.entries(eventMap).map(([event, statuses]) => ({
          event,
          total: Object.values(statuses).reduce((a, b) => a + b, 0),
          statuses: Object.entries(statuses)
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
        }))
      );

    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, datePreset]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const presets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7days', label: '7 Days' },
    { key: '30days', label: '30 Days' },
  ];

  function navigateToContacts(scope: string) {
    navigation.navigate('ContactsTab', { screen: 'ContactsList', params: { scope } });
  }

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={loading} onRefresh={loadDashboard} colors={[Colors.primary]} />
    }>
      <Text style={styles.welcome}>
        Welcome back, {user?.name || 'Enabler'}!
      </Text>

      {/* Connection */}
      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.statusActive : Colors.statusDanger }]} />
          <Text style={styles.statusText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigateToContacts('my')}
        >
          <Text style={styles.statValue}>{myContactsCount}</Text>
          <Text style={styles.statLabel}>My Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigateToContacts('all')}
        >
          <Text style={styles.statValue}>{totalContactsCount}</Text>
          <Text style={styles.statLabel}>Total Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Source Breakdown */}
      {(allSources.length > 0 || mySources.length > 0) && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Contacts by Source</Text>
          <View style={styles.sourceColumns}>
            <View style={styles.sourceColumn}>
              <Text style={styles.sourceColumnTitle}>My Sources</Text>
              {mySources.length === 0 ? (
                <Text style={styles.emptySmall}>No data</Text>
              ) : (
                mySources.map((s) => (
                  <TouchableOpacity
                    key={s.source}
                    style={styles.sourceRow}
                    onPress={() => navigation.navigate('ContactsTab', {
                      screen: 'ContactsList',
                      params: { scope: 'my', contactSource: s.source },
                    })}
                  >
                    <Text style={styles.sourceName}>{s.source}</Text>
                    <Text style={styles.sourceCount}>{s.count}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            <View style={styles.sourceDivider} />
            <View style={styles.sourceColumn}>
              <Text style={styles.sourceColumnTitle}>All Sources</Text>
              {allSources.length === 0 ? (
                <Text style={styles.emptySmall}>No data</Text>
              ) : (
                allSources.map((s) => (
                  <TouchableOpacity
                    key={s.source}
                    style={styles.sourceRow}
                    onPress={() => navigation.navigate('ContactsTab', {
                      screen: 'ContactsList',
                      params: { scope: 'all', contactSource: s.source },
                    })}
                  >
                    <Text style={styles.sourceName}>{s.source}</Text>
                    <Text style={styles.sourceCount}>{s.count}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </Card>
      )}

      {/* SG / 16-round / FRP Breakdown */}
      {enablerBreakdown.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>SGs & Progress</Text>
          <TouchableOpacity
            style={styles.enablerStatRow}
            onPress={() => navigation.navigate('ContactsTab', {
              screen: 'ContactsList',
              params: { isSg: 'true', scope: 'my' },
            })}
          >
            <Text style={styles.enablerStatLabel}>Spiritual Gems (SG)</Text>
            <Text style={[styles.enablerStatValue, { color: Colors.statusActive }]}>{sgTotal}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.enablerStatRow}
            onPress={() => navigation.navigate('ContactsTab', {
              screen: 'ContactsList',
              params: { chantingStatus: '16', scope: 'my' },
            })}
          >
            <Text style={styles.enablerStatLabel}>16+ Round Chanters</Text>
            <Text style={[styles.enablerStatValue, { color: Colors.primary }]}>{sixteenTotal}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.enablerStatRow}
            onPress={() => navigation.navigate('ContactsTab', {
              screen: 'ContactsList',
              params: { folkStage: 'FRP', scope: 'my' },
            })}
          >
            <Text style={styles.enablerStatLabel}>FRP</Text>
            <Text style={[styles.enablerStatValue, { color: Colors.accent }]}>{frpTotal}</Text>
          </TouchableOpacity>

          <View style={styles.enablerTableHeader}>
            <Text style={styles.enablerColName}>Enabler</Text>
            <Text style={styles.enablerColNum}>SG</Text>
            <Text style={styles.enablerColNum}>16+</Text>
            <Text style={styles.enablerColNum}>FRP</Text>
          </View>
          {enablerBreakdown.map((e) => (
            <TouchableOpacity
              key={e.enablerId || '__unassigned__'}
              style={styles.enablerRow}
              onPress={() => {
                if (!e.enablerId) return;
                navigation.navigate('ContactsTab', {
                  screen: 'ContactsList',
                  params: { enablerId: e.enablerId, scope: 'my' },
                });
              }}
            >
              <Text style={styles.enablerColName} numberOfLines={1}>{e.enablerName}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ContactsTab', {
                  screen: 'ContactsList',
                  params: { isSg: 'true', enablerId: e.enablerId || undefined, scope: 'my' },
                })}
              >
                <Text style={[styles.enablerColNum, { color: Colors.statusActive }]}>{e.sg}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ContactsTab', {
                  screen: 'ContactsList',
                  params: { chantingStatus: '16', enablerId: e.enablerId || undefined, scope: 'my' },
                })}
              >
                <Text style={[styles.enablerColNum, { color: Colors.primary }]}>{e.sixteen}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ContactsTab', {
                  screen: 'ContactsList',
                  params: { folkStage: 'FRP', enablerId: e.enablerId || undefined, scope: 'my' },
                })}
              >
                <Text style={[styles.enablerColNum, { color: Colors.accent }]}>{e.frp}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Date Picker */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Call Status</Text>
        <View style={styles.dateRow}>
          {presets.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.dateBtn, datePreset === p.key && styles.dateBtnActive]}
              onPress={() => setDatePreset(p.key)}
            >
              <Text style={[styles.dateBtnText, datePreset === p.key && styles.dateBtnTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              {getDateRange(datePreset).from.split('T')[0]}
            </Text>
          </View>
        </View>
      </Card>

      {/* Call Status by Event */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
      ) : eventBreakdown.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>No call logs for this period</Text>
        </Card>
      ) : (
        eventBreakdown.map((ev) => (
          <EventCard
            key={ev.event}
            event={ev}
            onStatusPress={(status) =>
              navigation.navigate('ContactsTab', {
                screen: 'ContactsList',
                params: { scope: 'my', callStatus: status, event: ev.event },
              })
            }
          />
        ))
      )}

      {totalCalls > 0 && (
        <Card style={styles.card}>
          <Text style={styles.totalCallsText}>Total Calls: {totalCalls}</Text>
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function EventCard({
  event,
  onStatusPress,
}: {
  event: EventBreakdown;
  onStatusPress: (status: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const picked = event.statuses.find((s) => s.status === 'A1 - Coming')?.count || 0;
  const eliminated = event.statuses
    .filter((s) => ELIMINATED_STATUSES.includes(s.status))
    .reduce((a, s) => a + s.count, 0);
  const notPicked = event.total - picked - eliminated;

  return (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.eventHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.eventName}>{event.event}</Text>
        <View style={styles.eventMeta}>
          <Text style={styles.eventTotal}>{event.total} calls</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summarySegment, { flex: picked || 0.5, backgroundColor: Colors.statusActive }]} />
        <View style={[styles.summarySegment, { flex: notPicked || 0.5, backgroundColor: Colors.warning }]} />
        <View style={[styles.summarySegment, { flex: eliminated || 0.5, backgroundColor: Colors.error }]} />
      </View>
      <View style={styles.summaryLabels}>
        <Text style={[styles.summaryLabel, { color: Colors.statusActive }]}>
          Picked: {picked}
        </Text>
        <Text style={[styles.summaryLabel, { color: Colors.warning }]}>
          Not Picked: {notPicked}
        </Text>
        <Text style={[styles.summaryLabel, { color: Colors.error }]}>
          Eliminated: {eliminated}
        </Text>
      </View>

      {expanded && (
        <View style={styles.statusList}>
          {event.statuses.map((s) => {
            const isEliminated = ELIMINATED_STATUSES.includes(s.status);
            const isPicked = s.status === 'A1 - Coming';
            const dotColor = isPicked
              ? Colors.statusActive
              : isEliminated
              ? Colors.error
              : Colors.warning;

            return (
              <TouchableOpacity
                key={s.status}
                style={styles.statusRow2}
                onPress={() => onStatusPress(s.status)}
              >
                <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                <Text style={styles.statusName}>{s.status}</Text>
                <Text style={styles.statusCount}>{s.count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Card>
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
  // Source breakdown columns
  sourceColumns: {
    flexDirection: 'row',
  },
  sourceColumn: {
    flex: 1,
  },
  sourceColumnTitle: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  sourceDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sourceName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  sourceCount: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  // Date picker
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  dateBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateBtnTextActive: {
    color: Colors.textOnPrimary,
  },
  dateInfo: {
    marginLeft: 'auto',
  },
  dateInfoText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  // Event card
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventTotal: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 10,
    color: Colors.textLight,
  },
  summaryBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  summarySegment: {
    height: '100%',
  },
  summaryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  statusList: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  statusRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  statusName: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  statusCount: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptySmall: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  enablerStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  enablerStatLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  enablerStatValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  enablerTableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  enablerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  enablerColName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  enablerColNum: {
    width: 40,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  totalCallsText: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
