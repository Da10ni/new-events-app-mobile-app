import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { messageApi } from '../../services/api/messageApi';
import { Text, Avatar } from '../../components/ui';
import { SearchBar } from '../../components/search';
import { EmptyState } from '../../components/layout';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<InboxStackParamList>;

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

export default function InboxScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector((s) => s.auth.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await messageApi.getConversations({ limit: 50 });
      setConversations(res.data.data.conversations);
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

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const other = getOther(c);
        const name = other.fullName || `${other.firstName} ${other.lastName}`;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => {
      const other = getOther(item);
      const name = other.fullName || `${other.firstName} ${other.lastName}`;
      const unread = item.unreadCounts?.[user?._id || ''] || 0;

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ChatScreen', {
              conversationId: item._id,
              recipientName: name,
            })
          }
          className="mx-4 mb-3 flex-row items-center rounded-2xl bg-white px-4 py-3.5"
          style={{
            ...Platform.select({
              ios: unread > 0
                ? { shadowColor: COLORS.primary[500], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }
                : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
              android: { elevation: unread > 0 ? 3 : 1 },
              default: {},
            }),
          }}
          activeOpacity={0.8}
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
                  {formatTimestamp(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>
            <View className="mt-1 flex-row items-center">
              <Text
                variant="caption"
                color={unread > 0 ? COLORS.neutral[500] : COLORS.neutral[400]}
                weight={unread > 0 ? 'medium' : 'regular'}
                numberOfLines={1}
                className="flex-1"
              >
                {item.listing ? `${item.listing.title} · ` : ''}
                {item.lastMessage?.text || 'No messages yet'}
              </Text>
              {unread > 0 && (
                <View
                  className="ml-2 items-center justify-center rounded-full px-1.5 py-0.5"
                  style={{ minWidth: 20, backgroundColor: COLORS.primary[500] }}
                >
                  <Text variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10 }}>
                    {unread}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, user?._id, getOther]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {conversations.length > 0 && (
        <View className="bg-white px-4 pb-3 pt-2">
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search conversations..."
            rounded="xl"
            showShadow={false}
          />
        </View>
      )}

      {filteredConversations.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-white">
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="No messages yet"
            description="When you contact a vendor or receive a message, it will appear here."
            actionTitle="Browse Services"
            onAction={() => {
              navigation.getParent()?.navigate('ExploreTab', { screen: 'ExploreScreen' });
            }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: LAYOUT.SCREEN_BOTTOM_PADDING }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary[500]} />
          }
        />
      )}
    </View>
  );
}
