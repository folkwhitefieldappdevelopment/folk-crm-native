import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

interface Props {
  progress: number;
  total: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export function ProgressBar({
  progress,
  total,
  showLabel = true,
  height = 8,
  color = Colors.primary,
}: Props) {
  const pct = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              height,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {progress}/{total}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.divider,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
});
