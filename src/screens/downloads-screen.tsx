import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { getApiClient } from '../services/api-client';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function DownloadsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  async function handleExportContacts() {
    setExportType('contacts');
    setIsExporting(true);
    try {
      const api = getApiClient();
      const response = await api.get('/people', {
        params: { take: 5000 },
        responseType: 'arraybuffer',
      });

      const csvContent = convertToCSV(response.data || []);
      const fileUri = (FileSystem as any).cacheDirectory + 'contacts_export.csv';
      await (FileSystem as any).writeAsStringAsync(fileUri, csvContent);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Contacts' });
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Exported', 'File saved to app documents.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to export contacts.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  }

  function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    return [headers, ...rows].join('\n');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads & Exports</Text>
        <Text style={styles.subtitle}>
          Export your data for backup or analysis
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Export Contacts</Text>
        <Text style={styles.cardDesc}>
          Download all contacts as a CSV file for use in spreadsheets.
        </Text>
        <Button
          title={
            isExporting && exportType === 'contacts'
              ? 'Exporting...'
              : 'Export CSV'
          }
          onPress={handleExportContacts}
          variant="primary"
          loading={isExporting && exportType === 'contacts'}
          style={styles.exportButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  exportButton: {
    minWidth: 160,
  },
});
