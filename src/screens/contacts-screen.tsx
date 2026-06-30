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
import { useConnectivity } from '../contexts/connectivity-context';
import { getSupabase } from '../services/supabase-client';
import { useAuth } from '../contexts/auth-context';

interface Contact {
  id: string;
  full_name: string;
  phone?: string;
  current_folk_stage?: string;
  location?: string;
}

interface Props {
  navigation: any;
  route: any;
}

export function ContactsScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { isConnected } = useConnectivity();
  const userId = user?.id;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const pageRef = useRef(0);
  const pageSize = 50;

  const buildBaseQuery = useCallback(() => {
    const supabase = getSupabase();
    let query = supabase
      .from('people')
      .select('id, full_name, phone, current_folk_stage, location', { count: 'exact' })
      .eq('is_deleted', false);

    const params = route?.params || {};

    if (params.scope === 'my' && userId) {
      query = query.eq('enabler_id', userId);
    }

    if (params.isSg === 'true') {
      query = query.eq('is_sg', true);
    }

    if (params.chantingStatus) {
      query = query.gte('chanting_status', parseInt(params.chantingStatus, 10));
    }

    if (params.folkStage) {
      query = query.eq('current_folk_stage', params.folkStage);
    }

    if (params.enablerId) {
      query = query.eq('enabler_id', params.enablerId);
    }

    if (params.contactSource) {
      query = query.contains('contact_source', [params.contactSource]);
    }

    if (params.callStatus) {
      query = query.eq('last_call_status', params.callStatus);
    }

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
    }

    return query;
  }, [userId, route?.params, search]);

  const fetchContacts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const baseQuery = buildBaseQuery();
      const from = reset ? 0 : pageRef.current * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await baseQuery.range(from, to).order('created_at', { ascending: false });

      if (reset) {
        setContacts(data || []);
        pageRef.current = 1;
      } else {
        setContacts((prev) => [...prev, ...(data || [])]);
        pageRef.current += 1;
      }

      setTotalCount(count || 0);
      setHasMore((data || []).length === pageSize);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery]);

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

  const params = route?.params || {};
  const activeFilterCount = Object.keys(params).filter(k => k !== 'scope' && params[k]).length;

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

      {activeFilterCount > 0 && (
        <Card style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>
            Filters active ({activeFilterCount})
          </Text>
        </Card>
      )}

      {isConnected ? null : (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Offline — showing cached data
          </Text>
        </Card>
      )}

      {totalCount !== null && contacts.length > 0 && (
        <Text style={styles.countText}>{totalCount} contact{totalCount !== 1 ? 's' : ''} found</Text>
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
                    {item.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {item.full_name}
                  </Text>
                  <Text style={styles.contactPhone}>
                    {item.phone}
                  </Text>
                  <Text style={styles.contactStage}>
                    {item.current_folk_stage}
                  </Text>
                </View>
                <Text style={styles.chevron}>{'\u203A'}</Text>
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
  filterBanner: {
    margin: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.primaryLight,
  },
  filterBannerText: {
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  offlineBanner: {
    margin: Spacing.md,
    marginBottom: 0,
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
  countText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    fontWeight: '600',
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
