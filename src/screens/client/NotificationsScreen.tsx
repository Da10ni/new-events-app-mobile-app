import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setNotifications,
  markRead,
  markAllRead,
  setLoading,
  setUnreadCount,
} from '../../store/slices/notificationSlice';
import { notificationApi } from '../../services/api/notificationApi';
import { showToast } from '../../store/slices/uiSlice';
import { Text } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationsScreen'>;

const NOTIFICATION_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  booking: { icon: 'calendar-outline', color: COLORS.primary[500], bg: COLORS.primary[50] },
  review: { icon: 'star-outline', color: COLORS.warning, bg: COLORS.warningLight },
  message: { icon: 'chatbubble-outline', color: COLORS.info, bg: COLORS.infoLight },
  system: { icon: 'information-circle-outline', color: COLORS.neutral[500], bg: COLORS.neutral[50] },
  promotion: { icon: 'megaphone-outline', color: COLORS.success, bg: COLORS.secondary[50] },
  payment: { icon: 'wallet-outline', color: COLORS.secondary[500], bg: COLORS.secondary[50] },
};

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: { entityType?: string; entityId?: string; actionUrl?: string };
  createdAt: string;
}

export default function NotificationsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { notifications, loading, unreadCount } = useAppSelector((s) => s.notification);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const res = await notificationApi.getAll({ limit: 50 });
      const notifs = res.data.data?.notifications || [];
      dispatch(setNotifications(notifs));

      const unreadRes = await notificationApi.getUnreadCount();
      dispatch(setUnreadCount(unreadRes.data.data?.count || 0));
    } catch {
      // silent
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      dispatch(markAllRead());
      dispatch(showToast({ message: 'All notifications marked as read', type: 'info' }));
    } catch {
      // silent
    }
  }, [dispatch]);

  const handleNotificationPress = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.isRead) {
        try {
          await notificationApi.markAsRead(notification._id);
          dispatch(markRead(notification._id));
        } catch {
          // silent
        }
      }
    },
    [dispatch]
  );

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const iconConfig = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.system;

      return (
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          className="mx-4 mb-3 flex-row rounded-2xl bg-white px-4 py-4"
          style={{
            ...Platform.select({
              ios: !item.isRead
                ? { shadowColor: COLORS.primary[500], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }
                : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
              android: { elevation: !item.isRead ? 2 : 1 },
              default: {},
            }),
          }}
          activeOpacity={0.8}
        >
          <View
            className="mr-3 items-center justify-center rounded-2xl"
            style={{ width: 44, height: 44, backgroundColor: iconConfig.bg }}
          >
            <Ionicons name={iconConfig.icon} size={20} color={iconConfig.color} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <Text
                variant="label"
                weight={item.isRead ? 'medium' : 'bold'}
                className="flex-1 pr-2"
                numberOfLines={1}
                color={COLORS.neutral[600]}
              >
                {item.title}
              </Text>
              <Text variant="caption" color={COLORS.neutral[300]} style={{ fontSize: 10 }}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
            <Text
              variant="caption"
              color={item.isRead ? COLORS.neutral[400] : COLORS.neutral[500]}
              className="mt-1"
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>

          {!item.isRead && (
            <View
              className="ml-2 mt-1 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS.primary[500] }}
            />
          )}
        </TouchableOpacity>
      );
    },
    [handleNotificationPress]
  );

  useEffect(() => {
    if (unreadCount > 0) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="label" weight="semibold" color={COLORS.primary[500]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: undefined });
    }
  }, [unreadCount, navigation, handleMarkAllRead]);

  if (loading && !refreshing && notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications"
          description="You are all caught up! Notifications about your bookings and messages will appear here."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
        }
      />
    </View>
  );
}
