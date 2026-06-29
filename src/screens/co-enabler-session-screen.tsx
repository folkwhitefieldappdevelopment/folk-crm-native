import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Avatar } from '../ui/components/Avatar';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';

interface Props {
  route: any;
  navigation: any;
}

export function CoEnablerSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  async function fetchSession() {
    try {
      const api = getApiClient();
      const response = await api.get(`/co-enabler/${sessionId}`);
      const data = response.data;
      setSession(data);

      if (data.peopleIds?.length > 0) {
        const personPromises = data.peopleIds.map((id: string) =>
          api.get(`/people/${id}`).then((r) => r.data).catch(() => null)
        );
        const results = await Promise.all(personPromises);
        setPeople(results.filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  function handleWhatsApp(phone: string) {
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Text style={styles.title}>{session.name}</Text>
        {session.task && (
          <Text style={styles.taskText}>{session.task}</Text>
        )}
        <Text style={styles.meta}>
          Created by {session.creatorName} | {people.length} contact
          {people.length !== 1 ? 's' : ''}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Contacts</Text>

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.personItem}>
            <Avatar name={item.fullName} photoUrl={item.photoUrl} />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{item.fullName}</Text>
              <Text style={styles.personPhone}>{item.phone}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleCall(item.phone)}
              >
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.whatsappBtn]}
                onPress={() => handleWhatsApp(item.phone)}
              >
                <Text style={styles.actionText}>WA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No contacts assigned</Text>
        }
        contentContainerStyle={people.length === 0 ? styles.emptyList : undefined}
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
  headerCard: {
    margin: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  taskText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  personInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  personName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  personPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.textOnPrimary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
  emptyList: {
    flex: 1,
  },
});
