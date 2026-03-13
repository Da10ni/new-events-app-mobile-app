import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderInboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { Text, Avatar, Badge, Skeleton, Divider } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type InboxNav = NativeStackNavigationProp<ProviderInboxStackParamList>;

interface Conversation {
  _id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
};

export default function ProviderInboxScreen() {
  const navigation = useNavigation<InboxNav>();
  const { vendor } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      // In a real app, this would call a messaging API
      // For now, we simulate with empty data or mock data
      // The API would be something like: messagingApi.getConversations()
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConversations([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [navigation, fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const nameParts = item.recipientName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3.5"
        onPress={() =>
          navigation.navigate('ProviderChatScreen', {
            conversationId: item._id,
            recipientName: item.recipientName,
          })
        }
        activeOpacity={0.7}
      >
        <View className="relative">
          <Avatar
            source={item.recipientAvatar}
            firstName={firstName}
            lastName={lastName}
            size="lg"
            online={item.isOnline}
          />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              variant="label"
              weight={item.unreadCount > 0 ? 'bold' : 'semibold'}
              className="flex-1 text-neutral-600"
              numberOfLines={1}
            >
              {item.recipientName}
            </Text>
            <Text
              variant="caption"
              color={item.unreadCount > 0 ? COLORS.primary[500] : COLORS.neutral[300]}
              weight={item.unreadCount > 0 ? 'semibold' : 'regular'}
            >
              {formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text
              variant="caption"
              color={item.unreadCount > 0 ? COLORS.neutral[500] : COLORS.neutral[300]}
              weight={item.unreadCount > 0 ? 'medium' : 'regular'}
              className="flex-1 mr-3"
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5">
                <Text variant="caption" weight="bold" color={COLORS.neutral[0]}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
        <View className="px-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row items-center mb-4">
              <Skeleton variant="circle" width={56} height={56} />
              <View className="ml-3 flex-1">
                <Skeleton variant="text" width="60%" height={16} className="mb-2" />
                <Skeleton variant="text" width="80%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
      {error && (
        <View className="mx-4 mt-2 rounded-xl bg-error-light px-4 py-3">
          <Text variant="label" color={COLORS.error}>{error}</Text>
        </View>
      )}

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary[500]}
            colors={[COLORS.primary[500]]}
          />
        }
        ItemSeparatorComponent={() => (
          <View className="pl-[76px]">
            <Divider />
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            icon="chatbubbles-outline"
            title="No Messages Yet"
            description="Messages from your clients will appear here. Stay responsive to build great relationships!"
          />
        )}
      />
    </SafeAreaView>
  );
}
