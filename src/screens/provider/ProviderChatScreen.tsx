import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProviderInboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { Text, Avatar } from '../../components/ui';
import { EmptyState } from '../../components/layout';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<ProviderInboxStackParamList, 'ProviderChatScreen'>;

interface ChatMessage {
  _id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  bookingRef?: {
    bookingNumber: string;
    listingTitle: string;
  };
}

const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / 86400000
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export default function ProviderChatScreen({ route }: Props) {
  const { recipientName, conversationId } = route.params;
  const { user } = useAppSelector((state) => state.auth);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const nameParts = recipientName.split(' ');
  const recipientFirstName = nameParts[0] || '';
  const recipientLastName = nameParts.slice(1).join(' ') || '';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // In a real app, this would call a messaging API
        // e.g., messagingApi.getMessages(conversationId)
        await new Promise((resolve) => setTimeout(resolve, 300));
        setMessages([]);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      _id: Date.now().toString(),
      senderId: user?._id || '',
      text,
      timestamp: new Date().toISOString(),
      isMe: true,
    };

    setMessages((prev) => [newMessage, ...prev]);
    setInputText('');

    // In a real app, send via messaging API
    // messagingApi.sendMessage(conversationId, text)
  }, [inputText, user?._id]);

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    // Check if we need a date header
    const showDateHeader =
      index === messages.length - 1 ||
      formatDateHeader(item.timestamp) !==
        formatDateHeader(messages[index + 1]?.timestamp);

    return (
      <>
        <View
          className={`px-4 mb-2 ${
            item.isMe ? 'items-end' : 'items-start'
          }`}
        >
          {/* Booking Reference (visual only) */}
          {item.bookingRef && (
            <View className="mb-1 max-w-[80%] rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <View className="flex-row items-center">
                <Ionicons name="receipt-outline" size={14} color={COLORS.neutral[400]} />
                <Text variant="caption" weight="semibold" color={COLORS.neutral[500]} className="ml-1">
                  Booking #{item.bookingRef.bookingNumber}
                </Text>
              </View>
              <Text variant="caption" color={COLORS.neutral[400]} className="mt-0.5">
                {item.bookingRef.listingTitle}
              </Text>
            </View>
          )}

          <View
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              item.isMe
                ? 'rounded-br-sm bg-primary-500'
                : 'rounded-bl-sm bg-neutral-50'
            }`}
          >
            <Text
              variant="body"
              color={item.isMe ? COLORS.neutral[0] : COLORS.neutral[600]}
            >
              {item.text}
            </Text>
          </View>
          <Text variant="caption" color={COLORS.neutral[300]} className="mt-1 px-1">
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>

        {showDateHeader && (
          <View className="items-center my-4">
            <View className="rounded-full bg-neutral-50 px-3 py-1">
              <Text variant="caption" weight="medium" color={COLORS.neutral[400]}>
                {formatDateHeader(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: messages.length === 0 ? 'center' : undefined,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center px-8 py-12">
              <Avatar
                firstName={recipientFirstName}
                lastName={recipientLastName}
                size="xl"
              />
              <Text variant="h4" weight="bold" className="mt-4 text-neutral-600">
                {recipientName}
              </Text>
              <Text
                variant="body"
                color={COLORS.neutral[400]}
                className="mt-2 text-center"
              >
                Start a conversation. Be responsive and professional to build trust with your clients.
              </Text>
            </View>
          )}
        />

        {/* Input Bar */}
        <View className="border-t border-neutral-100 bg-white px-4 py-3">
          <View className="flex-row items-end">
            <View className="flex-1 mr-3 min-h-[44px] max-h-[120px] rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 justify-center">
              <RNTextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.neutral[300]}
                multiline
                className="text-[16px] text-neutral-600 max-h-[100px]"
                style={{ paddingTop: 0, paddingBottom: 0 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                inputText.trim() ? 'bg-primary-500' : 'bg-neutral-100'
              }`}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? COLORS.neutral[0] : COLORS.neutral[300]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
