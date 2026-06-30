import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Loading } from '../ui/components/Loading';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import { getSupabase } from '../services/supabase-client';
import { ProgressTracker } from '../ui/components/ProgressTracker';

interface Person {
  id: string;
  fullName: string;
  phone?: string;
  photoUrl?: string;
  age?: number;
  currentFolkStage?: string;
  location?: string;
  stayingWith?: string;
  occupation?: string;
  organisation?: string;
  nativePlace?: string;
  sgRating?: number;
  chantingStatus?: number;
  relationshipStatus?: string;
  verifiedByFg?: string;
  enablerId?: string;
  folkGuideId?: string;
  folkId?: string;
  createdAt?: string;
  progress?: any[];
  callHistory?: CallLog[];
  attendanceHistory?: AttendanceEntry[];
  generalRemarks?: string;
  lastCallStatus?: string;
  lastCallAt?: string;
  nextFollowUpAt?: string;
}

interface CallLog {
  id?: string;
  callerName?: string;
  calledAt?: string;
  status?: string;
  remark?: string;
}

interface AttendanceEntry {
  eventName?: string;
  groupName?: string;
  attendedAt?: string;
}

interface Props {
  route: any;
  navigation: any;
}

export function ContactDetailScreen({ route, navigation }: Props) {
  const { personId } = route.params;
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [enablerName, setEnablerName] = useState('');
  const [folkGuideName, setFolkGuideName] = useState('');

  useEffect(() => {
    fetchPerson();
  }, [personId]);

  async function fetchPerson() {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Person not found');

      const p: Person = {
        id: data.id,
        fullName: data.fullName || data.full_name || '',
        phone: data.phone,
        photoUrl: data.photo_url || data.photoUrl,
        age: data.age,
        currentFolkStage: data.currentFolkStage || data.current_folk_stage,
        location: data.location,
        stayingWith: data.stayingWith || data.staying_with,
        occupation: data.occupation,
        organisation: data.organisation || data.organization,
        nativePlace: data.nativePlace || data.native_place,
        sgRating: data.sgRating || data.sg_rating,
        chantingStatus: data.chantingStatus || data.chanting_status,
        relationshipStatus: data.relationshipStatus || data.relationship_status,
        verifiedByFg: data.verifiedByFg || data.verified_by_fg,
        enablerId: data.enablerId || data.enabler_id,
        folkGuideId: data.folkGuideId || data.folk_guide_id,
        folkId: data.folkId || data.folk_id,
        createdAt: data.createdAt || data.created_at,
        progress: data.progress || [],
        callHistory: data.callHistory || data.call_history || [],
        attendanceHistory: data.attendanceHistory || data.attendance_history || [],
        generalRemarks: data.generalRemarks || data.general_remarks,
        lastCallStatus: data.lastCallStatus || data.last_call_status,
        lastCallAt: data.lastCallAt || data.last_call_at,
        nextFollowUpAt: data.nextFollowUpAt || data.next_follow_up_at,
      };

      setPerson(p);

      if (p.enablerId) {
        const { data: eData } = await supabase
          .from('people')
          .select('fullName, full_name')
          .eq('id', p.enablerId)
          .single();
        if (eData) setEnablerName(eData.fullName || eData.full_name || '');
      }
      if (p.folkGuideId) {
        const { data: fData } = await supabase
          .from('people')
          .select('fullName, full_name')
          .eq('id', p.folkGuideId)
          .single();
        if (fData) setFolkGuideName(fData.fullName || fData.full_name || '');
      }
    } catch (err) {
      console.error('Failed to fetch person:', err);
      Alert.alert('Error', 'Failed to load contact details');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${person?.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const api = getApiClient();
              await api.delete(`/people/${personId}`);
              navigation.navigate('ContactsList');
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Delete failed';
              Alert.alert('Error', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleProgressChange(
    catIndex: number,
    itemIndex: number,
    levelIndex: number,
    value: string,
    field: 'achieved' | 'remark'
  ) {
    if (!person) return;
    const progress = [...(person.progress || [])];
    if (!progress[catIndex]) return;
    const items = [...progress[catIndex].items];
    const item = { ...items[itemIndex] };
    const answers = { ...item.answers };
    const levelKey = `l${levelIndex + 1}`;
    const remarkKey = `l${levelIndex + 1}_remark`;
    answers[field === 'achieved' ? levelKey : remarkKey] = value;
    item.answers = answers;
    items[itemIndex] = item;
    progress[catIndex] = { ...progress[catIndex], items };
    setPerson({ ...person, progress });
  }

  async function handleSaveProgress() {
    if (!person) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('people')
        .update({ progress: person.progress })
        .eq('id', person.id);
      if (error) throw error;
      Alert.alert('Saved', 'Progress updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save progress');
    }
  }

  if (loading) {
    return <Loading message="Loading contact..." />;
  }

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Contact not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {person.photoUrl ? (
          <Image
            source={{ uri: person.photoUrl }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {person.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{person.fullName}</Text>
        {person.phone && <Text style={styles.phone}>📞 {person.phone}</Text>}
        <Text style={styles.stageBadge}>
          {person.currentFolkStage || 'Unknown'}
        </Text>
      </View>

      {/* Enabler / Folk Guide Info */}
      {(enablerName || folkGuideName) && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Assigned To</Text>
          {enablerName ? renderInfoRow('Enabler', enablerName) : null}
          {folkGuideName ? renderInfoRow('Folk Guide', folkGuideName) : null}
        </Card>
      )}

      {/* Personal Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>
        {renderInfoRow('Location', person.location)}
        {renderInfoRow('Staying With', person.stayingWith)}
        {renderInfoRow('Occupation', person.occupation)}
        {renderInfoRow('Organisation', person.organisation)}
        {renderInfoRow('Native Place', person.nativePlace)}
        {renderInfoRow('Age', person.age?.toString())}
        {renderInfoRow('Relationship', person.relationshipStatus)}
        {renderInfoRow('Verified by FG', person.verifiedByFg)}
        {person.folkId && renderInfoRow('Folk ID', person.folkId)}
      </Card>

      {/* Spiritual Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Spiritual Info</Text>
        {renderInfoRow('SG Rating', person.sgRating?.toString())}
        {renderInfoRow('Chanting Status', person.chantingStatus?.toString())}
      </Card>

      {/* Last Call Info */}
      {person.lastCallStatus && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Last Call</Text>
          {renderInfoRow('Status', person.lastCallStatus)}
          {person.lastCallAt &&
            renderInfoRow(
              'Called At',
              new Date(person.lastCallAt).toLocaleString()
            )}
        </Card>
      )}

      {/* General Remarks */}
      {person.generalRemarks && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Remarks</Text>
          <Text style={styles.remarksText}>{person.generalRemarks}</Text>
        </Card>
      )}

      {/* Progress Tracker */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Spiritual Progress</Text>
        <ProgressTracker
          progress={person.progress}
          onProgressChange={handleProgressChange}
          isEditable={true}
        />
        <Button
          title="Save Progress"
          onPress={handleSaveProgress}
          variant="primary"
          style={styles.saveProgressBtn}
        />
      </Card>

      {/* Call History */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          Call History ({person.callHistory?.length || 0})
        </Text>
        {person.callHistory && person.callHistory.length > 0 ? (
          person.callHistory.map((log, index) => (
            <View key={log.id || index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyStatus}>{log.status}</Text>
                <Text style={styles.historyDate}>
                  {log.calledAt
                    ? new Date(log.calledAt).toLocaleDateString()
                    : ''}
                </Text>
              </View>
              {log.callerName && (
                <Text style={styles.historyDetail}>By: {log.callerName}</Text>
              )}
              {log.remark && (
                <Text style={styles.historyDetail}>{log.remark}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No call history</Text>
        )}
      </Card>

      {/* Attendance History */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          Attendance ({person.attendanceHistory?.length || 0})
        </Text>
        {person.attendanceHistory && person.attendanceHistory.length > 0 ? (
          person.attendanceHistory.map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyStatus}>
                {entry.eventName || 'Event'}
              </Text>
              <Text style={styles.historyDate}>
                {entry.attendedAt
                  ? new Date(entry.attendedAt).toLocaleDateString()
                  : ''}
              </Text>
              {entry.groupName && (
                <Text style={styles.historyDetail}>
                  Group: {entry.groupName}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No attendance records</Text>
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Edit Contact"
          onPress={() =>
            navigation.navigate('ContactForm', {
              personId: person.id,
            })
          }
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="Delete Contact"
          onPress={handleDelete}
          loading={deleting}
          variant="outline"
          style={[styles.actionButton, styles.deleteButton]}
          textStyle={styles.deleteText}
        />
      </View>
    </ScrollView>
  );
}

function renderInfoRow(label: string, value?: string) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.primary,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.textOnPrimary,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginBottom: Spacing.xs,
  },
  phone: {
    fontSize: FontSize.lg,
    color: '#E0E0E0',
    marginBottom: Spacing.sm,
  },
  stageBadge: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.accent,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  remarksText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  historyItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyStatus: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  historyDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  saveProgressBtn: {
    marginTop: Spacing.md,
    height: 40,
  },
  actions: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionButton: {
    height: 48,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  deleteText: {
    color: Colors.error,
  },
});
