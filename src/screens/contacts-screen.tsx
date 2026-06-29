import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import { useConnectivity } from '../contexts/connectivity-context';

interface Contact {
  id: string;
  fullName: string;
  phone?: string;
  currentFolkStage?: string;
  location?: string;
}

interface Props {
  navigation: any;
}

export function ContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const { isConnected } = useConnectivity();
  const pageSize = 50;

  const fetchContacts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const api = getApiClient();
      const skip = reset ? 0 : pageRef.current * pageSize;
      const response = await api.get('/people', {
        params: {
          skip,
          take: pageSize,
          search: search || undefined,
        },
      });

      const data: Contact[] = response.data;

      if (reset) {
        setContacts(data);
        pageRef.current = 1;
      } else {
        setContacts((prev) => [...prev, ...data]);
        pageRef.current += 1;
      }

      setHasMore(data.length === pageSize);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      pageRef.current = 0;
      fetchContacts(true);
    });
    return unsubscribe;
  }, [navigation, fetchContacts]);

  function handleSearch() {
    pageRef.current = 0;
    fetchContacts(true);
  }

  function handleLoadMore() {
    if (hasMore && !loading) {
      fetchContacts();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button
          title="Search"
          onPress={handleSearch}
          variant="primary"
          style={styles.searchButton}
          textStyle={styles.searchButtonText}
        />
        <TouchableOpacity
          style={styles.addFab}
          onPress={() => navigation.navigate('ContactForm', {})}
        >
          <Text style={styles.addFabText}>+</Text>
        </TouchableOpacity>
      </View>

      {isConnected ? null : (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline — showing cached data
          </Text>
        </Card>
      )}

      {loading && contacts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() =>
                navigation.navigate('ContactDetail', {
                  personId: item.id,
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {item.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {item.fullName}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {item.phone}
                  </Text>
                  <Text style={styles.contactStage}>
                    {item.currentFolkStage}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && contacts.length > 0 ? (
              <ActivityIndicator
                style={styles.paginationLoading}
                size="small"
                color={Colors.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No contacts found. Pull down to refresh.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={loading && contacts.length > 0}
              onRefresh={() => {
                pageRef.current = 0;
                fetchContacts(true);
              }}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  searchButton: {
    height: 40,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  searchButtonText: {
    fontSize: FontSize.sm,
  },
  addFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
    marginTop: -2,
  },
  offlineBanner: {
    margin: Spacing.md,
    backgroundColor: Colors.warning,
  },
  offlineText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  contactItem: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contactAvatarText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactStage: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  paginationLoading: {
    padding: Spacing.lg,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
});
