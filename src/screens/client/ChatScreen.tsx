import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { Text } from '../../components/ui';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<InboxStackParamList, 'ChatScreen'>;

interface Message {
  _id: string;
  text: string;
  senderId: string;
  timestamp: string;
  isRead: boolean;
}

export default function ChatScreen({ route }: Props) {
  const { conversationId, recipientName } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const currentUserId = user?._id || 'current-user';

  const [messages, setMessages] = useState<Message[]>([
    {
      _id: '1',
      text: 'Hi! I am interested in your services for my upcoming event.',
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
    },
    {
      _id: '2',
      text: 'Hello! Thank you for your interest. I would love to help with your event. Could you tell me more about what you are looking for?',
      senderId: 'vendor',
      timestamp: new Date(Date.now() - 3000000).toISOString(),
      isRead: true,
    },
    {
      _id: '3',
      text: 'We are planning a wedding reception for about 200 guests. We need full decoration and catering services.',
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 2400000).toISOString(),
      isRead: true,
    },
    {
      _id: '4',
      text: 'That sounds wonderful! I have several packages that would be perfect for a wedding reception of that size. Would you like to schedule a call to discuss the details?',
      senderId: 'vendor',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isRead: true,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);

  const handleSend = useCallback(() => {
    if (inputText.trim().length === 0) return;

    const newMessage: Message = {
      _id: Date.now().toString(),
      text: inputText.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, currentUserId]);

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMine = item.senderId === currentUserId;
      const showTimestamp =
        index === 0 ||
        new Date(item.timestamp).getTime() -
          new Date(messages[index - 1].timestamp).getTime() >
          300000; // 5 minutes

      return (
        <View className={`mb-1 px-4 ${isMine ? 'items-end' : 'items-start'}`}>
          {showTimestamp && (
            <Text
              variant="caption"
              color={COLORS.neutral[300]}
              className="mb-2 text-center"
              style={{ alignSelf: 'center' }}
            >
              {formatTime(item.timestamp)}
            </Text>
          )}
          <View
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              isMine
                ? 'rounded-br-sm bg-primary-500'
                : 'rounded-bl-sm bg-neutral-50'
            }`}
          >
            <Text
              variant="body"
              color={isMine ? COLORS.neutral[0] : COLORS.neutral[600]}
            >
              {item.text}
            </Text>
          </View>
          {isMine && item.isRead && (
            <View className="mt-0.5 flex-row items-center">
              <Ionicons name="checkmark-done" size={14} color={COLORS.success} />
            </View>
          )}
        </View>
      );
    },
    [currentUserId, messages]
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Input Bar */}
      <View className="border-t border-neutral-100 bg-white px-4 pb-6 pt-3">
        <View className="flex-row items-end">
          <TouchableOpacity className="mr-2 items-center justify-center rounded-full bg-neutral-50 p-2.5">
            <Ionicons name="add" size={22} color={COLORS.neutral[400]} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-end rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
            <RNTextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.neutral[300]}
              multiline
              maxLength={1000}
              className="max-h-[100px] flex-1 text-[16px] text-neutral-600"
              style={{ paddingVertical: 4 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={inputText.trim().length === 0}
            className={`ml-2 items-center justify-center rounded-full p-2.5 ${
              inputText.trim().length > 0 ? 'bg-primary-500' : 'bg-neutral-200'
            }`}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim().length > 0 ? COLORS.neutral[0] : COLORS.neutral[300]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
