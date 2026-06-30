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
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Button } from '../ui/components/Button';
import { Loading } from '../ui/components/Loading';
import { getApiClient } from '../services/api-client';
import { getSupabase } from '../services/supabase-client';

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
  const [photoUri, setPhotoUri] = useState('');
  const [enablerId, setEnablerId] = useState('');
  const [enablerName, setEnablerName] = useState('');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [enablers, setEnablers] = useState<Array<{ id: string; fullName: string }>>([]);
  const [showEnablerPicker, setShowEnablerPicker] = useState(false);

  useEffect(() => {
    fetchEnablers();
    if (personId) fetchPerson();
  }, [personId]);

  async function fetchEnablers() {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('people')
        .select('id, fullName, full_name');
      if (data) {
        setEnablers(
          data.map((p: any) => ({
            id: p.id,
            fullName: p.fullName || p.full_name || '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch enablers:', err);
    }
  }

  async function fetchPerson() {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .single();
      if (error) throw error;
      if (!data) throw new Error('Not found');

      setFullName(data.fullName || data.full_name || '');
      setPhone(data.phone || '');
      setAge(data.age?.toString() || '');
      setCurrentFolkStage(data.currentFolkStage || data.current_folk_stage || 'Fresh Lead');
      setLocation(data.location || '');
      setStayingWith(data.stayingWith || data.staying_with || '');
      setOccupation(data.occupation || '');
      setOrganisation(data.organisation || data.organization || '');
      setNativePlace(data.nativePlace || data.native_place || '');
      setSgRating(data.sgRating?.toString() || data.sg_rating?.toString() || '');
      setChantingStatus(data.chantingStatus?.toString() || data.chanting_status?.toString() || '');
      setRelationshipStatus(data.relationshipStatus || data.relationship_status || '');
      setGeneralRemarks(data.generalRemarks || data.general_remarks || '');
      setPhotoUri(data.photoUrl || data.photo_url || '');
      setEnablerId(data.enablerId || data.enabler_id || '');
      if (data.enablerId || data.enabler_id) {
        const eid = data.enablerId || data.enabler_id;
        const found = enablers.find((e) => e.id === eid);
        if (found) setEnablerName(found.fullName);
      }
    } catch (err) {
      console.error('Failed to fetch person:', err);
      Alert.alert('Error', 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to pick a photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleEnablerSelect(id: string, name: string) {
    setEnablerId(id);
    setEnablerName(name);
    setShowEnablerPicker(false);
  }

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
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
        chantingStatus: chantingStatus ? parseInt(chantingStatus, 10) : undefined,
        relationshipStatus: relationshipStatus.trim() || undefined,
        generalRemarks: generalRemarks.trim() || undefined,
        photoUrl: photoUri || undefined,
        enablerId: enablerId || undefined,
      };

      if (isEditing) {
        const api = getApiClient();
        await api.put(`/people/${personId}`, payload);
      } else {
        const api = getApiClient();
        await api.post('/people', payload);
      }

      navigation.goBack();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Save failed';
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
        {/* Photo */}
        <Text style={styles.sectionTitle}>Photo</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Enabler Assignment */}
        <Text style={styles.sectionTitle}>Assignment</Text>
        <Text style={styles.label}>Enabler</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowEnablerPicker(!showEnablerPicker)}
        >
          <Text style={[styles.pickerButtonText, !enablerName && styles.pickerPlaceholder]}>
            {enablerName || 'Select Enabler...'}
          </Text>
          <Text style={styles.pickerChevron}>{showEnablerPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showEnablerPicker && (
          <View style={styles.pickerList}>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => handleEnablerSelect('', '')}
            >
              <Text style={styles.pickerItemText}>None</Text>
            </TouchableOpacity>
            {enablers.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={[styles.pickerItem, enablerId === e.id && styles.pickerItemActive]}
                onPress={() => handleEnablerSelect(e.id, e.fullName)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    enablerId === e.id && styles.pickerItemTextActive,
                  ]}
                >
                  {e.fullName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  photoPicker: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 28,
  },
  photoPlaceholderText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  pickerButton: {
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  pickerButtonText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#888',
  },
  pickerChevron: {
    fontSize: 10,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  pickerList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  pickerItemText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  pickerItemTextActive: {
    fontWeight: 'bold',
    color: Colors.primary,
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
