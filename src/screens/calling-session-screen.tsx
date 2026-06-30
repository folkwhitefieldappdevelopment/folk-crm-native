import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { Loading } from '../ui/components/Loading';
import { getApiClient } from '../services/api-client';
import { getSupabase } from '../services/supabase-client';

const CALL_STATUSES = [
  'A1', 'A2', 'A3', 'A4',
  'B', 'C', 'D', 'E', 'F', 'G',
  'Z',
];

const STATUS_COLORS: Record<string, string> = {
  A1: '#4CAF50', A2: '#66BB6A', A3: '#81C784', A4: '#A5D6A7',
  B: '#FF9800', C: '#FFA726', D: '#FFB74D', E: '#FFCC80',
  F: '#EF5350', G: '#E57373',
  Z: '#9E9E9E',
};

interface PersonInfo {
  id: string;
  fullName: string;
  phone?: string;
  currentFolkStage?: string;
  location?: string;
  callHistory?: Array<{
    id?: string;
    callerName?: string;
    calledAt?: string;
    status?: string;
    remark?: string;
  }>;
}

interface SessionData {
  id: string;
  name: string;
  current_index: number;
  status: string;
  people?: Array<{
    id: string;
    person?: PersonInfo;
  }>;
}

interface Props {
  route: any;
  navigation: any;
}

export function CallingSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [isSg, setIsSg] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const currentIndexRef = useRef(0);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    resetForm();
  }, [session?.current_index]);

  async function fetchSession() {
    try {
      const api = getApiClient();
      const response = await api.get(`/calling-sessions/${sessionId}`);
      setSession(response.data);
      currentIndexRef.current = response.data.current_index || 0;
    } catch (err) {
      console.error('Failed to fetch session:', err);
      Alert.alert('Error', 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedStatus('');
    setRemark('');
    setIsSg('');
    setFollowUpDate('');
  }

  const people = session?.people || [];
  const currentIdx = session?.current_index || 0;
  const currentPerson = people[currentIdx]?.person;
  const total = people.length;
  const progress = total > 0 ? currentIdx / total : 0;

  async function updateSessionIndex(newIndex: number) {
    try {
      const api = getApiClient();
      await api.put(`/calling-sessions/${sessionId}`, {
        currentIndex: newIndex,
      });
    } catch (err) {
      console.error('Failed to update session index:', err);
    }
  }

  async function ensureSpiritualGemsGroup(): Promise<string | null> {
    try {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('name', 'Spiritual Gems')
        .maybeSingle();
      if (existing) return existing.id;

      const { data: created } = await supabase
        .from('groups')
        .insert({
          name: 'Spiritual Gems',
          description: 'Contacts marked as Spiritual Gems during outreach',
          created_by_name: 'System',
          creator_role: JSON.stringify(['Admin', 'Folk Guide', 'Folk Enabler']),
          visibility: JSON.stringify(['Admin', 'Folk Guide', 'Folk Enabler']),
          member_count: 0,
          is_dynamic: false,
          color: '#EAB308',
        })
        .select('id')
        .single();
      return created?.id || null;
    } catch (err) {
      console.error('Failed to ensure Spiritual Gems group:', err);
      return null;
    }
  }

  async function addPersonToSpiritualGems(personId: string) {
    try {
      const groupId = await ensureSpiritualGemsGroup();
      if (!groupId) return;
      const supabase = getSupabase();
      await supabase.from('group_members').insert({
        group_id: groupId,
        contact_id: personId,
      });
    } catch (err) {
      console.error('Failed to add to Spiritual Gems:', err);
    }
  }

  async function removePersonFromSpiritualGems(personId: string) {
    try {
      const supabase = getSupabase();
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('name', 'Spiritual Gems')
        .maybeSingle();
      if (group) {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', group.id)
          .eq('contact_id', personId);
      }
    } catch (err) {
      console.error('Failed to remove from Spiritual Gems:', err);
    }
  }

  async function handleSaveAndNext() {
    if (!currentPerson) return;

    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a call status');
      return;
    }

    setSaving(true);
    try {
      const api = getApiClient();

      const callEntry: Record<string, any> = {
        id: `${currentPerson.id}-${Date.now()}`,
        callerName: 'Native App',
        calledAt: new Date().toISOString(),
        status: selectedStatus,
        remark: remark || undefined,
      };

      const updatePayload: Record<string, any> = {
        lastCallAt: new Date().toISOString(),
        lastCallStatus: selectedStatus,
        lastCallRemark: remark || undefined,
        isSg: isSg === 'Yes',
      };

      if (followUpDate.trim()) {
        updatePayload.nextFollowUpAt = followUpDate.trim();
      }

      const currentPersonData = await api.get(`/people/${currentPerson.id}`);
      const existingHistory = currentPersonData.data.callHistory || [];
      updatePayload.callHistory = [...existingHistory, callEntry];

      await api.put(`/people/${currentPerson.id}`, updatePayload);

      if (isSg === 'Yes') {
        await addPersonToSpiritualGems(currentPerson.id);
      } else if (isSg === 'No') {
        await removePersonFromSpiritualGems(currentPerson.id);
      }

      if (currentIdx < total - 1) {
        const nextIdx = currentIdx + 1;
        await updateSessionIndex(nextIdx);
        setSession((prev) =>
          prev ? { ...prev, current_index: nextIdx } : prev
        );
      } else {
        await api.put(`/calling-sessions/${sessionId}`, {
          status: 'completed',
        });
        Alert.alert('Session Complete', 'All contacts processed!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (currentIdx < total - 1) {
      const nextIdx = currentIdx + 1;
      await updateSessionIndex(nextIdx);
      setSession((prev) =>
        prev ? { ...prev, current_index: nextIdx } : prev
      );
    }
  }

  async function handlePrev() {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      await updateSessionIndex(prevIdx);
      setSession((prev) =>
        prev ? { ...prev, current_index: prevIdx } : prev
      );
    }
  }

  async function handleEndSession() {
    Alert.alert(
      'End Session',
      `You've processed ${currentIdx}/${total} contacts. End this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = getApiClient();
              await api.put(`/calling-sessions/${sessionId}`, {
                status: 'completed',
              });
              navigation.goBack();
            } catch {
              // ignore
            }
          },
        },
      ]
    );
  }

  function handleCall() {
    if (currentPerson?.phone) {
      Linking.openURL(`tel:${currentPerson.phone}`);
    }
  }

  function handleWhatsApp() {
    if (currentPerson?.phone) {
      const phone = currentPerson.phone.replace(/[^0-9]/g, '');
      const url = Platform.select({
        ios: `https://wa.me/${phone}`,
        android: `whatsapp://send?phone=${phone}`,
        default: `https://wa.me/${phone}`,
      });
      Linking.openURL(url);
    }
  }

  if (loading) return <Loading message="Loading session..." />;
  if (!session) {
    return (
      <View style={styles.center}>
        <Text>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIdx + 1} / {total}
        </Text>
      </View>

      <ScrollView style={styles.scrollArea}>
        {currentPerson ? (
          <Card style={styles.personCard}>
            <View style={styles.personHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentPerson.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{currentPerson.fullName}</Text>
                <Text style={styles.personPhone}>
                  📞 {currentPerson.phone || '—'}
                </Text>
                <Text style={styles.personStage}>
                  {currentPerson.currentFolkStage}
                </Text>
                {currentPerson.location && (
                  <Text style={styles.personLocation}>
                    📍 {currentPerson.location}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionBtn} onPress={handleCall}>
                <Text style={styles.quickActionIcon}>📞</Text>
                <Text style={styles.quickActionLabel}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={handleWhatsApp}>
                <Text style={styles.quickActionIcon}>💬</Text>
                <Text style={styles.quickActionLabel}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={styles.personCard}>
            <Text style={styles.emptyPerson}>No more contacts in this session</Text>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Call Status</Text>
          <View style={styles.statusGrid}>
            {CALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor:
                      selectedStatus === s ? STATUS_COLORS[s] : Colors.surface,
                    borderColor:
                      selectedStatus === s ? STATUS_COLORS[s] : Colors.border,
                  },
                ]}
                onPress={() => setSelectedStatus(s)}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    {
                      color:
                        selectedStatus === s ? '#FFF' : STATUS_COLORS[s],
                    },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Is he SG?</Text>
          <View style={styles.isSgRow}>
            {['Yes', 'No'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.isSgBtn,
                  isSg === opt && styles.isSgBtnActive,
                ]}
                onPress={() => setIsSg(isSg === opt ? '' : opt)}
              >
                <Text
                  style={[
                    styles.isSgBtnText,
                    isSg === opt && styles.isSgBtnTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Remark</Text>
          <TextInput
            style={styles.remarkInput}
            value={remark}
            onChangeText={setRemark}
            placeholder="Add a remark..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Follow-up Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={followUpDate}
            onChangeText={setFollowUpDate}
            placeholder="e.g. 2026-07-15"
            placeholderTextColor="#888"
          />
        </Card>

        {currentPerson?.callHistory && currentPerson.callHistory.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.cardTitle}>
                Call History ({currentPerson.callHistory.length})
              </Text>
              <Text style={styles.historyChevron}>
                {showHistory ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {showHistory &&
              currentPerson.callHistory
                .slice(-5)
                .reverse()
                .map((log, idx) => (
                  <View key={log.id || idx} style={styles.historyItem}>
                    <View style={styles.historyRow}>
                      <Text
                        style={[
                          styles.historyStatus,
                          {
                            color:
                              STATUS_COLORS[log.status || ''] ||
                              Colors.textPrimary,
                          },
                        ]}
                      >
                        {log.status}
                      </Text>
                      <Text style={styles.historyDate}>
                        {log.calledAt
                          ? new Date(log.calledAt).toLocaleDateString()
                          : ''}
                      </Text>
                    </View>
                    {log.remark && (
                      <Text style={styles.historyRemark}>{log.remark}</Text>
                    )}
                  </View>
                ))}
          </Card>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handlePrev}
          disabled={currentIdx === 0}
        >
          <Text
            style={[
              styles.navBtnText,
              currentIdx === 0 && styles.navBtnDisabled,
            ]}
          >
            ◀ Prev
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <Button
          title={currentIdx < total - 1 ? 'Save & Next' : 'Finish'}
          onPress={handleSaveAndNext}
          loading={saving}
          variant="accent"
          style={styles.saveBtn}
        />
      </View>

      <View style={styles.endBar}>
        <TouchableOpacity onPress={handleEndSession}>
          <Text style={styles.endText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.divider, borderRadius: 4, marginRight: Spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontSize: FontSize.sm, fontWeight: 'bold', color: Colors.textSecondary },
  scrollArea: { flex: 1 },
  personCard: { margin: Spacing.md },
  personHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: 26, fontWeight: 'bold', color: Colors.textOnPrimary },
  personInfo: { flex: 1 },
  personName: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.textPrimary },
  personPhone: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  personStage: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: 'bold', marginTop: 2 },
  personLocation: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  quickActions: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm },
  quickActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  quickActionIcon: { fontSize: 16, marginRight: Spacing.xs },
  quickActionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  emptyPerson: { textAlign: 'center', color: Colors.textLight, fontSize: FontSize.md },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.primary, marginBottom: Spacing.sm },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBtn: { width: 48, height: 40, borderRadius: BorderRadius.sm, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  statusBtnText: { fontSize: FontSize.md, fontWeight: 'bold' },
  isSgRow: { flexDirection: 'row', gap: Spacing.md },
  isSgBtn: { flex: 1, height: 44, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  isSgBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  isSgBtnText: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.textSecondary },
  isSgBtnTextActive: { color: Colors.textOnPrimary },
  remarkInput: { height: 80, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  input: { height: 44, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  historyToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyChevron: { fontSize: 12, color: Colors.textLight },
  historyItem: { paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyStatus: { fontWeight: 'bold', fontSize: FontSize.sm },
  historyDate: { fontSize: FontSize.xs, color: Colors.textLight },
  historyRemark: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  navBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  navBtnText: { fontSize: FontSize.md, fontWeight: 'bold', color: Colors.primary },
  navBtnDisabled: { color: Colors.textLight },
  skipBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  skipBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flex: 1, height: 44 },
  endBar: { alignItems: 'center', paddingBottom: Spacing.md, backgroundColor: Colors.surface },
  endText: { fontSize: FontSize.sm, color: Colors.error, fontWeight: '600' },
});
