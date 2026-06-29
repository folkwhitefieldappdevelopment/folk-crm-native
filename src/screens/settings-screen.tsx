import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { getApiClient } from '../services/api-client';

interface Setting {
  contactSources: string[];
  folkStages: string[];
  occupationStatuses: string[];
  stayingWithOptions: string[];
  sgOptions: string[];
  maOptions: string[];
  frpOptions: string[];
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const api = getApiClient();
      const response = await api.get('/settings');
      const data = response.data;

      function parseJsonArray(val: any): string[] {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      }

      setSettings({
        contactSources: parseJsonArray(data.contactSources),
        folkStages: parseJsonArray(data.folkStages),
        occupationStatuses: parseJsonArray(data.occupationStatuses),
        stayingWithOptions: parseJsonArray(data.stayingWithOptions),
        sgOptions: parseJsonArray(data.sgOptions),
        maOptions: parseJsonArray(data.maOptions),
        frpOptions: parseJsonArray(data.frpOptions),
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {settings && (
        <>
          <Section title="Folk Stages" items={settings.folkStages} />
          <Section
            title="Contact Sources"
            items={settings.contactSources}
          />
          <Section
            title="Occupation Statuses"
            items={settings.occupationStatuses}
          />
          <Section
            title="Staying With"
            items={settings.stayingWithOptions}
          />
          <Section title="SG Options" items={settings.sgOptions} />
          <Section title="MA Options" items={settings.maOptions} />
          <Section title="FRP Options" items={settings.frpOptions} />
        </>
      )}

      {!settings && !loading && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No settings available
          </Text>
        </Card>
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tags}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
});
