import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  'at-risk': { bg: '#FFF3E0', text: '#E65100' },
  danger: { bg: '#FFEBEE', text: '#C62828' },
  emergency: { bg: '#FCE4EC', text: '#880E4F' },
  progressing: { bg: '#E3F2FD', text: '#1565C0' },
  declining: { bg: '#F3E5F5', text: '#7B1FA2' },
  'A1 - Coming': { bg: '#E8F5E9', text: '#2E7D32' },
  'A2 - Not Interested': { bg: '#F1F8E9', text: '#558B2F' },
  'A3 - Wrong Number': { bg: '#F9FBE7', text: '#827717' },
  'A4 - Tentative': { bg: '#F1F8E9', text: '#689F38' },
  'B - Not Answering': { bg: '#FFF3E0', text: '#E65100' },
  'C - Out of Station': { bg: '#FFF8E1', text: '#F57F17' },
  'D - Switch Off': { bg: '#FFFDE7', text: '#F9A825' },
  'E - Not Reachable': { bg: '#FFF8E1', text: '#F57F17' },
  'F - Callback': { bg: '#FBE9E7', text: '#BF360C' },
  'G - Completely Shifted': { bg: '#FBE9E7', text: '#BF360C' },
  'Z - Already Attended': { bg: '#ECEFF1', text: '#546E7A' },
};

interface Props {
  label: string;
  type?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ label, type, size = 'sm' }: Props) {
  const key = type || label;
  const colors = STATUS_COLORS[key] || { bg: '#F5F5F5', text: '#616161' };
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isSmall ? styles.sm : styles.md,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          isSmall ? styles.textSm : styles.textMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  text: {
    fontWeight: 'bold',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: FontSize.sm,
  },
});
