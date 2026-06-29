import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { SearchBar } from '../ui/components/SearchBar';
import { Avatar } from '../ui/components/Avatar';
import { getApiClient } from '../services/api-client';

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string[];
  photoUrl?: string;
  fgCode?: string;
}

export function UserManagementScreen() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'Folk Enabler' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const api = getApiClient();
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchUsers();
  }

  function openCreate() {
    setEditUser(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'Folk Enabler' });
    setShowModal(true);
  }

  function openEdit(user: AppUser) {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role[0] || 'Folk Enabler',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    try {
      const api = getApiClient();
      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: [form.role],
        });
      } else {
        await api.post('/users', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: [form.role],
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save user');
    }
  }

  async function handleDelete(user: AppUser) {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = getApiClient();
              await api.delete(`/users/${user.id}`);
              fetchUsers();
            } catch {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  }

  const filtered = search
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

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
        <Text style={styles.title}>User Management</Text>
        <Button
          title="+ Add"
          onPress={openCreate}
          variant="accent"
          style={styles.addButton}
        />
      </View>

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search users..."
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Avatar name={item.name} photoUrl={item.photoUrl} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userRole}>
                {item.role?.join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteBtnText}>Del</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editUser ? 'Edit User' : 'Create User'}
            </Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Full name"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="Email address"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              placeholder="Phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />

            {!editUser && (
              <>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  placeholder="Password"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.rolePicker}>
              {['Admin', 'Folk Guide', 'Folk Enabler'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleOption,
                    form.role === r && styles.roleOptionSelected,
                  ]}
                  onPress={() => setForm({ ...form, role: r })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      form.role === r && styles.roleOptionTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  searchRow: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  userRole: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  editBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  editBtnText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleOptionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleOptionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  modalButton: {
    flex: 1,
  },
});
