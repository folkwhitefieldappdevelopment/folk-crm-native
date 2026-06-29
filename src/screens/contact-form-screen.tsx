import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Button } from '../ui/components/Button';
import { Loading } from '../ui/components/Loading';
import { getApiClient } from '../services/api-client';

interface Props {
  route: any;
  navigation: any;
}

export function ContactFormScreen({ route, navigation }: Props) {
  const personId = route.params?.personId;
  const isEditing = !!personId;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [currentFolkStage, setCurrentFolkStage] = useState('Fresh Lead');
  const [location, setLocation] = useState('');
  const [stayingWith, setStayingWith] = useState('');
  const [occupation, setOccupation] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [nativePlace, setNativePlace] = useState('');
  const [sgRating, setSgRating] = useState('');
  const [chantingStatus, setChantingStatus] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [generalRemarks, setGeneralRemarks] = useState('');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (personId) {
      fetchPerson();
    }
  }, [personId]);

  async function fetchPerson() {
    try {
      const api = getApiClient();
      const response = await api.get(`/people/${personId}`);
      const p = response.data;
      setFullName(p.fullName || '');
      setPhone(p.phone || '');
      setAge(p.age?.toString() || '');
      setCurrentFolkStage(p.currentFolkStage || 'Fresh Lead');
      setLocation(p.location || '');
      setStayingWith(p.stayingWith || '');
      setOccupation(p.occupation || '');
      setOrganisation(p.organisation || '');
      setNativePlace(p.nativePlace || '');
      setSgRating(p.sgRating?.toString() || '');
      setChantingStatus(p.chantingStatus?.toString() || '');
      setRelationshipStatus(p.relationshipStatus || '');
      setGeneralRemarks(p.generalRemarks || '');
    } catch (err) {
      console.error('Failed to fetch person:', err);
      Alert.alert('Error', 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const api = getApiClient();
      const payload: Record<string, any> = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        currentFolkStage: currentFolkStage || 'Fresh Lead',
        location: location.trim() || undefined,
        stayingWith: stayingWith.trim() || undefined,
        occupation: occupation.trim() || undefined,
        organisation: organisation.trim() || undefined,
        nativePlace: nativePlace.trim() || undefined,
        sgRating: sgRating ? parseInt(sgRating, 10) : undefined,
        chantingStatus: chantingStatus
          ? parseInt(chantingStatus, 10)
          : undefined,
        relationshipStatus:
          relationshipStatus.trim() || undefined,
        generalRemarks: generalRemarks.trim() || undefined,
      };

      if (isEditing) {
        await api.put(`/people/${personId}`, payload);
      } else {
        await api.post('/people', payload);
      }

      navigation.goBack();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Save failed';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading message="Loading contact..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Basic Info</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          placeholderTextColor="#888"
          keyboardType="number-pad"
        />

        <Text style={styles.sectionTitle}>Contact Details</Text>

        <Text style={styles.label}>Folk Stage</Text>
        <TextInput
          style={styles.input}
          value={currentFolkStage}
          onChangeText={setCurrentFolkStage}
          placeholder="e.g. Fresh Lead, Diamond-club 16"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="City / Area"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Staying With</Text>
        <TextInput
          style={styles.input}
          value={stayingWith}
          onChangeText={setStayingWith}
          placeholder="e.g. Parents, Spouse, Alone"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Occupation</Text>
        <TextInput
          style={styles.input}
          value={occupation}
          onChangeText={setOccupation}
          placeholder="Occupation"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Organisation</Text>
        <TextInput
          style={styles.input}
          value={organisation}
          onChangeText={setOrganisation}
          placeholder="Organisation / Company"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Native Place</Text>
        <TextInput
          style={styles.input}
          value={nativePlace}
          onChangeText={setNativePlace}
          placeholder="Native Place"
          placeholderTextColor="#888"
        />

        <Text style={styles.sectionTitle}>Spiritual</Text>

        <Text style={styles.label}>SG Rating</Text>
        <TextInput
          style={styles.input}
          value={sgRating}
          onChangeText={setSgRating}
          placeholder="0-10"
          placeholderTextColor="#888"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Chanting Status</Text>
        <TextInput
          style={styles.input}
          value={chantingStatus}
          onChangeText={setChantingStatus}
          placeholder="e.g. 16 rounds, 4 rounds"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Relationship Status</Text>
        <TextInput
          style={styles.input}
          value={relationshipStatus}
          onChangeText={setRelationshipStatus}
          placeholder="e.g. Single, Married"
          placeholderTextColor="#888"
        />

        <Text style={styles.sectionTitle}>Notes</Text>

        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={generalRemarks}
          onChangeText={setGeneralRemarks}
          placeholder="General remarks"
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={isEditing ? 'Update' : 'Create'}
            onPress={handleSave}
            loading={saving}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  actionButton: {
    flex: 1,
    height: 48,
  },
});
