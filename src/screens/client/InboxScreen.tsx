import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InboxStackParamList } from '../../navigation/types';
import { Text, Avatar } from '../../components/ui';
import { SearchBar } from '../../components/search';
import { EmptyState } from '../../components/layout';
import { LAYOUT } from '../../config/constants';
import { COLORS } from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<InboxStackParamList>;

interface Conversation {
  _id: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientFirstName: string;
  recipientLastName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [];

export default function InboxScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      setConversations(MOCK_CONVERSATIONS);
      setFilteredConversations(MOCK_CONVERSATIONS);
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (text.trim() === '') {
        setFilteredConversations(conversations);
      } else {
        const filtered = conversations.filter((conv) =>
          conv.recipientName.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredConversations(filtered);
      }
    },
    [conversations]
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

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ChatScreen', {
            conversationId: item._id,
            recipientName: item.recipientName,
          })
        }
        className="mx-4 mb-3 flex-row items-center rounded-2xl bg-white px-4 py-3.5"
        style={{
          ...Platform.select({
            ios: item.unreadCount > 0
              ? { shadowColor: COLORS.primary[500], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }
              : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
            android: { elevation: item.unreadCount > 0 ? 3 : 1 },
            default: {},
          }),
        }}
        activeOpacity={0.8}
      >
        <Avatar
          source={item.recipientAvatar}
          firstName={item.recipientFirstName}
          lastName={item.recipientLastName}
          size="lg"
          online={item.isOnline}
        />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              variant="label"
              weight={item.unreadCount > 0 ? 'bold' : 'semibold'}
              className="flex-1"
              numberOfLines={1}
              color={COLORS.neutral[600]}
            >
              {item.recipientName}
            </Text>
            <Text
              variant="caption"
              color={item.unreadCount > 0 ? COLORS.primary[500] : COLORS.neutral[300]}
              weight={item.unreadCount > 0 ? 'semibold' : 'regular'}
            >
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          <View className="mt-1 flex-row items-center">
            <Text
              variant="caption"
              color={item.unreadCount > 0 ? COLORS.neutral[500] : COLORS.neutral[400]}
              weight={item.unreadCount > 0 ? 'medium' : 'regular'}
              numberOfLines={1}
              className="flex-1"
            >
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View
                className="ml-2 items-center justify-center rounded-full px-1.5 py-0.5"
                style={{ minWidth: 20, backgroundColor: COLORS.primary[500] }}
              >
                <Text variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10 }}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

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
        <View className="flex-1 bg-white">
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
