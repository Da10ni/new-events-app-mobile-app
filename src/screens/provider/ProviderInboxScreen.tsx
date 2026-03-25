import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProviderInboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { messageApi } from '../../services/api/messageApi';
import { Text, Avatar, Divider } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type InboxNav = NativeStackNavigationProp<ProviderInboxStackParamList>;

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: { url: string };
}

interface Conversation {
  _id: string;
  participants: Participant[];
  listing?: { _id: string; title: string };
  lastMessage?: {
    text: string;
    sender: string;
    createdAt: string;
  };
  unreadCounts: Record<string, number>;
  createdAt: string;
}

const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ProviderInboxScreen() {
  const navigation = useNavigation<InboxNav>();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await messageApi.getConversations({ limit: 50 });
      setConversations(res.data.data.conversations || []);
    } catch {
      // silently fail
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setLoading(true);
        await fetchConversations();
        setLoading(false);
      };
      init();
    }, [fetchConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const getOther = useCallback(
    (convo: Conversation): Participant => {
      return convo.participants.find((p) => p._id !== user?._id) || convo.participants[0];
    },
    [user?._id]
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const other = getOther(item);
    const name = other.fullName || `${other.firstName} ${other.lastName}`;
    const unread = item.unreadCounts?.[user?._id || ''] || 0;

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3.5"
        onPress={() =>
          navigation.navigate('ProviderChatScreen', {
            conversationId: item._id,
            recipientName: name,
          })
        }
        activeOpacity={0.7}
      >
        <Avatar
          source={other.avatar?.url}
          firstName={other.firstName}
          lastName={other.lastName}
          size="lg"
        />

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              variant="label"
              weight={unread > 0 ? 'bold' : 'semibold'}
              className="flex-1"
              numberOfLines={1}
              color={COLORS.neutral[600]}
            >
              {name}
            </Text>
            {item.lastMessage?.createdAt && (
              <Text
                variant="caption"
                color={unread > 0 ? COLORS.primary[500] : COLORS.neutral[300]}
                weight={unread > 0 ? 'semibold' : 'regular'}
              >
                {formatMessageTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text
              variant="caption"
              color={unread > 0 ? COLORS.neutral[500] : COLORS.neutral[400]}
              weight={unread > 0 ? 'medium' : 'regular'}
              className="flex-1 mr-3"
              numberOfLines={1}
            >
              {item.listing ? `${item.listing.title} · ` : ''}
              {item.lastMessage?.text || 'No messages yet'}
            </Text>
            {unread > 0 && (
              <View
                className="h-5 min-w-[20px] items-center justify-center rounded-full px-1.5"
                style={{ backgroundColor: COLORS.primary[500] }}
              >
                <Text variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10 }}>
                  {unread > 99 ? '99+' : unread}
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white" edges={['left', 'right']}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right']}>
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
