import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { EmptyState } from '../ui/components/EmptyState';
import { useAuth } from '../contexts/auth-context';
import {
  getUserNotifications,
  markNotificationRead,
  clearNotifications,
  type AppNotification,
} from '../services/notification-service';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  navigation: any;
}

const TYPE_ICONS: Record<string, string> = {
  info: '\u2139\uFE0F',
  alarm: '\uD83D\uDD14',
  success: '\u2705',
  warning: '\u26A0\uFE0F',
};

export function NotificationCenterScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getUserNotifications(user.id);
      setNotifications(result);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function handleClearAll() {
    if (!user) return;
    await clearNotifications(user.id);
    setNotifications([]);
  }

  async function handleTap(n: AppNotification) {
    if (!n.isRead) {
      await handleMarkRead(n.id);
    }
    if (n.personId) {
      navigation.navigate('ContactDetail', { personId: n.personId });
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount} unread
            </Text>
          </View>
          {notifications.length > 0 && (
            <Button
              title="Clear All"
              onPress={handleClearAll}
              variant="ghost"
              style={styles.clearButton}
            />
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notifItem,
              !item.isRead && styles.unreadItem,
            ]}
            onPress={() => handleTap(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>
              {TYPE_ICONS[item.type] || '\u2139\uFE0F'}
            </Text>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text
                  style={[
                    styles.notifTitle,
                    !item.isRead && styles.unreadTitle,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <View style={styles.notifFooter}>
                <Text style={styles.notifTime}>
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
                </Text>
                {item.senderName && (
                  <Text style={styles.notifSender}>
                    by {item.senderName}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="\uD83D\uDCE2"
            title="No Notifications"
            message="You're all caught up!"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications();
            }}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : undefined
        }
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
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    height: 36,
    paddingHorizontal: Spacing.md,
  },
  notifItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  unreadItem: {
    backgroundColor: Colors.primaryLight + '30',
  },
  notifIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  notifMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  notifSender: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
  },
});
