import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

const STATUS_GROUPS = [
  {
    label: 'Picked',
    items: [
      { key: 'A1 - Coming', label: 'A1', color: '#2E7D32', bg: '#E8F5E9' },
      { key: 'A2 - Not Interested', label: 'A2', color: '#558B2F', bg: '#F1F8E9' },
      { key: 'A3 - Wrong Number', label: 'A3', color: '#827717', bg: '#F9FBE7' },
      { key: 'A4 - Tentative', label: 'A4', color: '#689F38', bg: '#F1F8E9' },
    ],
  },
  {
    label: 'Not Picked',
    items: [
      { key: 'B - Not Answering', label: 'B', color: '#E65100', bg: '#FFF3E0' },
      { key: 'C - Out of Station', label: 'C', color: '#F57F17', bg: '#FFF8E1' },
      { key: 'D - Switch Off', label: 'D', color: '#F9A825', bg: '#FFFDE7' },
      { key: 'E - Not Reachable', label: 'E', color: '#F57F17', bg: '#FFF8E1' },
      { key: 'F - Callback', label: 'F', color: '#BF360C', bg: '#FBE9E7' },
      { key: 'G - Completely Shifted to Another city', label: 'G', color: '#BF360C', bg: '#FBE9E7' },
    ],
  },
  {
    label: 'Eliminated',
    items: [
      { key: 'Z - Already Attended', label: 'Z', color: '#546E7A', bg: '#ECEFF1' },
    ],
  },
];

interface Props {
  selected: string | null;
  onSelect: (key: string) => void;
}

export function CallStatusGrid({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {STATUS_GROUPS.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.grid}>
            {group.items.map((item) => {
              const isSelected = selected === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.item,
                    { backgroundColor: item.bg },
                    isSelected && { borderColor: item.color, borderWidth: 2 },
                  ]}
                  onPress={() => onSelect(item.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.itemLabel, { color: item.color }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  group: {
    gap: Spacing.sm,
  },
  groupLabel: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  item: {
    minWidth: 56,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemLabel: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
});
