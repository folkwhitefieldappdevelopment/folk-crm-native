import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';

interface ProgressLevelAnswers {
  l1: string;
  l2: string;
  l3: string;
  l1_remark: string;
  l2_remark: string;
  l3_remark: string;
}

interface ProgressItem {
  question: string;
  levels: [string, string, string];
  answers: ProgressLevelAnswers;
}

interface ProgressCategory {
  name: string;
  items: ProgressItem[];
}

interface Props {
  progress?: ProgressCategory[];
  onProgressChange: (
    catIndex: number,
    itemIndex: number,
    levelIndex: number,
    value: string,
    field: 'achieved' | 'remark'
  ) => void;
  isEditable: boolean;
}

function parseNumber(str: string): number | null {
  if (!str) return null;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function getCellColor(currentValue: string, goalValue: string): string {
  const value = (currentValue || '').trim();
  if (!value || value === '-') return Colors.surface;

  const goalNumber = parseNumber(goalValue);
  const currentNumber = parseNumber(value);

  if (goalNumber !== null && goalNumber > 0) {
    if (currentNumber === null) return '#FEE2E2';
    const ratio = currentNumber / goalNumber;
    if (ratio >= 1) return '#DCFCE7';
    if (ratio >= 0.75) return '#FEF9C3';
    if (ratio >= 0.5) return '#FFEDD5';
    return '#FEE2E2';
  }

  if (goalValue.toLowerCase() === 'yes') {
    return value.toLowerCase() === 'yes' ? '#DCFCE7' : '#FEE2E2';
  }

  if (goalValue && !goalNumber) {
    return value ? '#DBEAFE' : Colors.surface;
  }

  return Colors.surface;
}

const defaultProgress: ProgressCategory[] = [
  {
    name: 'Association',
    items: [
      { question: 'FR Staying (Or) FR Visiting', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Special Association of Senior devotees', levels: ['1', '1', '1'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'One-on-One Association (>20 min)', levels: ['6', '8', '12'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Weekly programs attended (No.s)', levels: ['4', '4', '4'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Guru issue related', levels: ['SP Office Quote', 'Struggle for Truth', 'Final Order'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
    ],
  },
  {
    name: 'Book Reading',
    items: [
      { question: 'Reading (mins per day)', levels: ['30 mins', '45 mins', '60 mins'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Perfect Questions and Perfect Answers', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Beyond Birth and Death', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Hare Krishna Challenge', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Laws of Nature', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Civilization and Transcendence', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Life comes from Life', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Second Chance', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: "Teaching's of Prahlada Maharaj", levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Nectar of Instructions', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'On the way to Krishna', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'SSR', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Bhagavad Gita', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Journey of Self Discovery', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Prabhupada Messenger of the Supreme Lord', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Krishna Book', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
    ],
  },
  {
    name: 'Chanting',
    items: [
      { question: 'Chanting (No of rounds)', levels: ['16', '16', '16'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
    ],
  },
  {
    name: 'Devotional Service (or) Deity Darshan (or) Diet',
    items: [
      { question: 'Book Distribution (Total in Hrs)', levels: ['8 Hrs', '12 Hrs', '16 Hrs'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Service (Total in Hrs)', levels: ['8 Hrs', '12 Hrs', '16 Hrs'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Festival Service / Organizing preaching programs (Total No of Days)', levels: ['1', '1', '1'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'No of MA / Overnight stay in the temple', levels: ['8 Aratis (MA/DA/SA)', '8 Aratis (MA/DA/SA)', '8 Aratis (MA/DA/SA)'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Ekadashi & Spl day fasting', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: '4 regulative principles', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Avoid Non - veg', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Rise early', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Avoid Onion & Garlic', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Avoid Coffee/Tea', levels: ['Yes', 'Yes', 'Yes'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
    ],
  },
  {
    name: 'Expedition',
    items: [
      { question: 'Long Trip', levels: ['1', '1', '1'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: 'Short Trip', levels: ['1', '1', '1'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
      { question: '1 Day Trip', levels: ['2', '2', '2'], answers: { l1: '', l2: '', l3: '', l1_remark: '', l2_remark: '', l3_remark: '' } },
    ],
  },
];

export function ProgressTracker({ progress, onProgressChange, isEditable }: Props) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const displayProgress = progress && progress.length > 0 ? progress : defaultProgress;

  function toggleCat(name: string) {
    setExpandedCats(prev => ({ ...prev, [name]: !prev[name] }));
  }

  function renderValueInput(
    catIndex: number,
    itemIndex: number,
    levelIndex: number,
    goalValue: string,
    currentValue: string
  ) {
    const goalNumber = parseNumber(goalValue);

    if (goalNumber !== null) {
      return (
        <View style={styles.valueBtnRow}>
          {Array.from({ length: goalNumber + 1 }, (_, i) => String(i)).map(
            (opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.valueBtn,
                  currentValue === opt && styles.valueBtnActive,
                ]}
                onPress={() =>
                  onProgressChange(
                    catIndex,
                    itemIndex,
                    levelIndex,
                    currentValue === opt ? '' : opt,
                    'achieved'
                  )
                }
              >
                <Text
                  style={[
                    styles.valueBtnText,
                    currentValue === opt && styles.valueBtnTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      );
    }

    if (goalValue.toLowerCase() === 'yes') {
      return (
        <View style={styles.valueBtnRow}>
          {['Yes', 'No'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.valueBtn,
                currentValue === opt && styles.valueBtnActive,
              ]}
              onPress={() =>
                onProgressChange(
                  catIndex,
                  itemIndex,
                  levelIndex,
                  currentValue === opt ? '' : opt,
                  'achieved'
                )
              }
            >
              <Text
                style={[
                  styles.valueBtnText,
                  currentValue === opt && styles.valueBtnTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <TextInput
        style={styles.cellInput}
        value={currentValue}
        placeholder="-"
        placeholderTextColor="#BBB"
        onChangeText={(text) =>
          onProgressChange(catIndex, itemIndex, levelIndex, text, 'achieved')
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Checklist</Text>
        <View style={styles.levelNav}>
          <TouchableOpacity
            style={[styles.levelBtn, currentLevel === 1 && styles.levelBtnDisabled]}
            onPress={() => setCurrentLevel((l) => Math.max(1, l - 1))}
            disabled={currentLevel === 1}
          >
            <Text style={[styles.levelBtnText, currentLevel === 1 && styles.levelBtnTextDisabled]}>
              ◀
            </Text>
          </TouchableOpacity>
          <Text style={styles.levelText}>Level {currentLevel}</Text>
          <TouchableOpacity
            style={[styles.levelBtn, currentLevel === 3 && styles.levelBtnDisabled]}
            onPress={() => setCurrentLevel((l) => Math.min(3, l + 1))}
            disabled={currentLevel === 3}
          >
            <Text style={[styles.levelBtnText, currentLevel === 3 && styles.levelBtnTextDisabled]}>
              ▶
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.columnHeaders}>
        <Text style={[styles.colHeader, styles.colCategory]}>Category</Text>
        <Text style={[styles.colHeader, styles.colGoal]}>Goal</Text>
        <Text style={[styles.colHeader, styles.colAchieved]}>Done</Text>
        <Text style={[styles.colHeader, styles.colNote]}>Note</Text>
      </View>

      <ScrollView style={styles.body} nestedScrollEnabled>
        {displayProgress.map((category, catIndex) => (
          <View key={category.name} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCat(category.name)}
            >
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.chevron}>
                {expandedCats[category.name] ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedCats[category.name] &&
              category.items.map((item, itemIndex) => {
                const levelIndex = currentLevel - 1;
                const goal = item.levels[levelIndex];
                const levelKey = `l${levelIndex + 1}` as keyof ProgressLevelAnswers;
                const remarkKey = `l${levelIndex + 1}_remark` as keyof ProgressLevelAnswers;
                const currentValue = item.answers[levelKey] || '';
                const currentRemark = item.answers[remarkKey] || '';
                const cellColor = getCellColor(currentValue, goal);

                return (
                  <View key={item.question} style={styles.row}>
                    <View style={[styles.cell, styles.colCategory]}>
                      <Text style={styles.cellText} numberOfLines={2}>
                        {item.question}
                      </Text>
                    </View>
                    <View style={[styles.cell, styles.colGoal]}>
                      <Text style={styles.goalText}>{goal || '-'}</Text>
                    </View>
                    <View style={[styles.cell, styles.colAchieved, { backgroundColor: cellColor }]}>
                      {isEditable ? (
                        renderValueInput(catIndex, itemIndex, levelIndex, goal, currentValue)
                      ) : (
                        <Text style={styles.cellText}>{currentValue || '-'}</Text>
                      )}
                    </View>
                    <View style={[styles.cell, styles.colNote]}>
                      {isEditable ? (
                        <TextInput
                          style={styles.cellInput}
                          value={currentRemark}
                          placeholder="-"
                          placeholderTextColor="#BBB"
                          onChangeText={(text) =>
                            onProgressChange(catIndex, itemIndex, levelIndex, text, 'remark')
                          }
                        />
                      ) : (
                        <Text style={styles.cellText}>{currentRemark || '-'}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  levelNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  levelBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBtnDisabled: {
    backgroundColor: Colors.border,
  },
  levelBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  levelBtnTextDisabled: {
    color: Colors.textLight,
  },
  levelText: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    width: 60,
    textAlign: 'center',
  },
  columnHeaders: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colHeader: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.textLight,
    textTransform: 'uppercase',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  colCategory: {
    flex: 2.5,
    textAlign: 'left',
    paddingLeft: Spacing.md,
  },
  colGoal: {
    flex: 1,
  },
  colAchieved: {
    flex: 1.5,
  },
  colNote: {
    flex: 1.5,
  },
  body: {
    maxHeight: 400,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  categoryName: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
    flex: 1,
  },
  chevron: {
    fontSize: 10,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    minHeight: 44,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: Spacing.xs,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  cellText: {
    fontSize: 10,
    color: Colors.textPrimary,
  },
  goalText: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  cellInput: {
    fontSize: 10,
    color: Colors.textPrimary,
    textAlign: 'center',
    padding: 0,
    margin: 0,
    height: 32,
  },
  valueBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    justifyContent: 'center',
  },
  valueBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  valueBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  valueBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  valueBtnTextActive: {
    color: Colors.textOnPrimary,
  },
});
