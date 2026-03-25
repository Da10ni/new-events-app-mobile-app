import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InboxStackParamList } from '../../navigation/types';
import { useAppSelector } from '../../store/hooks';
import { messageApi } from '../../services/api/messageApi';
import { Text } from '../../components/ui';
import { COLORS } from '../../theme/colors';

type Props = NativeStackScreenProps<InboxStackParamList, 'ChatScreen'>;

interface MessageParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: { url: string };
}

interface ReplyTo {
  _id: string;
  text: string;
  sender: MessageParticipant | string;
  isDeleted?: boolean;
}

interface Message {
  _id: string;
  conversation: string;
  sender: MessageParticipant | string;
  text: string;
  isRead: boolean;
  replyTo?: ReplyTo | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
}

const getSenderId = (msg: Message): string =>
  typeof msg.sender === 'string' ? msg.sender : msg.sender._id;

const getSenderName = (sender: MessageParticipant | string): string =>
  typeof sender === 'string' ? '' : sender.firstName || sender.fullName || '';

const getReplyLabel = (sender: MessageParticipant | string | undefined, currentUserId: string): string => {
  if (!sender || typeof sender === 'string') return '';
  return sender._id === currentUserId ? 'You' : getSenderName(sender);
};

export default function ChatScreen({ route }: Props) {
  const { conversationId } = route.params;
  const user = useAppSelector((s) => s.auth.user);
  const currentUserId = user?._id || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollReady, setScrollReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Menu state
  const [menuMessage, setMenuMessage] = useState<Message | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialScrollDone = useRef(false);

  const scrollToEnd = useCallback((animated = false) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => scrollToEnd(true), 150);
    });
    return () => sub.remove();
  }, [scrollToEnd]);

  // Aggressive scroll to bottom after initial load
  useEffect(() => {
    if (!loading && messages.length > 0 && !initialScrollDone.current) {
      const timers = [50, 150, 300, 500].map((delay) =>
        setTimeout(() => scrollToEnd(false), delay)
      );
      setTimeout(() => {
        initialScrollDone.current = true;
        setScrollReady(true);
      }, 600);
      return () => timers.forEach(clearTimeout);
    }
  }, [loading, messages.length, scrollToEnd]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await messageApi.getMessages(conversationId, { limit: 100 });
      setMessages(res.data.data.messages);
      await messageApi.markAsRead(conversationId);
    } catch {
      // silently fail
    }
  }, [conversationId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      initialScrollDone.current = false;
      setScrollReady(false);
      await fetchMessages();
      setLoading(false);
    };
    init();

    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages]);

  // Send message
  const handleSend = useCallback(async () => {
    const text = (editingMessageId ? editText : inputText).trim();
    if (!text) return;

    if (editingMessageId) {
      // Edit
      setSending(true);
      try {
        const res = await messageApi.editMessage(conversationId, editingMessageId, text);
        setMessages((prev) =>
          prev.map((m) => (m._id === editingMessageId ? res.data.data.message : m))
        );
      } catch {
        // silently fail
      }
      setEditingMessageId(null);
      setEditText('');
      setSending(false);
      return;
    }

    // New message or reply
    const replyToId = replyingTo?._id;
    setInputText('');
    setReplyingTo(null);
    setSending(true);
    try {
      const res = await messageApi.sendMessage(conversationId, text, replyToId);
      setMessages((prev) => [...prev, res.data.data.message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInputText(text);
    }
    setSending(false);
  }, [conversationId, inputText, editText, editingMessageId, replyingTo]);

  // Delete message
  const handleDelete = useCallback(async (messageId: string) => {
    try {
      const res = await messageApi.deleteMessage(conversationId, messageId);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? res.data.data.message : m))
      );
    } catch {
      // silently fail
    }
    setMenuMessage(null);
  }, [conversationId]);

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg._id);
    setEditText(msg.text);
    setInputText('');
    setReplyingTo(null);
    setMenuMessage(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const startReplying = (msg: Message) => {
    setReplyingTo(msg);
    setEditingMessageId(null);
    setEditText('');
    setMenuMessage(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReplying = () => {
    setReplyingTo(null);
  };

  const formatTime = (timestamp: string): string =>
    new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const inputValue = editingMessageId ? editText : inputText;
  const inputDisabled = sending || !(editingMessageId ? editText.trim() : inputText.trim());

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = getSenderId(item) === currentUserId;
      const isBeingEdited = editingMessageId === item._id;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => !item.isDeleted && setMenuMessage(item)}
          style={{
            marginBottom: 8,
            paddingHorizontal: 12,
            alignItems: isMine ? 'flex-end' : 'flex-start',
          }}
        >
          <View
            style={{
              maxWidth: '80%',
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
              ...(item.isDeleted
                ? { backgroundColor: COLORS.neutral[100] }
                : isMine
                  ? {
                      backgroundColor: COLORS.primary[400],
                      borderBottomRightRadius: 4,
                      opacity: isBeingEdited ? 0.7 : 1,
                    }
                  : {
                      backgroundColor: '#FFFFFF',
                      borderBottomLeftRadius: 4,
                      borderWidth: 1,
                      borderColor: COLORS.neutral[200],
                    }),
            }}
          >
            {/* Reply context */}
            {item.replyTo && !item.isDeleted && (
              <View
                style={{
                  marginBottom: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderLeftWidth: 2,
                  borderLeftColor: isMine ? 'rgba(255,255,255,0.4)' : COLORS.neutral[300],
                  backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : COLORS.neutral[50],
                }}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={12}
                  color={isMine ? 'rgba(255,255,255,0.6)' : COLORS.neutral[400]}
                  style={{ marginRight: 4 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="caption"
                    weight="semibold"
                    color={isMine ? 'rgba(255,255,255,0.7)' : COLORS.neutral[500]}
                    numberOfLines={1}
                    style={{ fontSize: 10, marginBottom: 1 }}
                  >
                    {getReplyLabel(item.replyTo.sender, currentUserId)}
                  </Text>
                  <Text
                    variant="caption"
                    color={isMine ? 'rgba(255,255,255,0.6)' : COLORS.neutral[400]}
                    numberOfLines={1}
                    style={{ fontSize: 11 }}
                  >
                    {item.replyTo.isDeleted ? 'This message was deleted' : item.replyTo.text}
                  </Text>
                </View>
              </View>
            )}

            {/* Message text */}
            <Text
              variant="body"
              color={
                item.isDeleted
                  ? COLORS.neutral[400]
                  : isMine
                    ? '#FFFFFF'
                    : COLORS.neutral[600]
              }
              style={{
                fontSize: 15,
                lineHeight: 21,
                ...(item.isDeleted ? { fontStyle: 'italic' as const } : {}),
              }}
            >
              {item.isDeleted ? 'This message was deleted' : item.text}
            </Text>

            {/* Time + edited */}
            <Text
              variant="caption"
              style={{ fontSize: 10, marginTop: 3, textAlign: 'right' }}
              color={
                item.isDeleted
                  ? COLORS.neutral[300]
                  : isMine
                    ? 'rgba(255,255,255,0.7)'
                    : COLORS.neutral[300]
              }
            >
              {formatTime(item.createdAt)}
              {item.isEdited && !item.isDeleted ? ' · edited' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [currentUserId, editingMessageId]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
      </View>
    );
  }

  const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const wrapperProps = Platform.OS === 'ios'
    ? { style: { flex: 1, backgroundColor: '#fff' }, behavior: 'padding' as const, keyboardVerticalOffset: 90 }
    : { style: { flex: 1, backgroundColor: '#fff' } };

  return (
    <Wrapper {...wrapperProps}>
      {messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
          <Ionicons name="chatbubble-ellipses-outline" size={56} color={COLORS.neutral[300]} />
          <Text variant="body" color={COLORS.neutral[400]} style={{ marginTop: 12 }}>
            Start your conversation
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1, justifyContent: 'flex-end' }}
            onContentSizeChange={() => {
              if (!initialScrollDone.current) scrollToEnd(false);
            }}
            style={{ backgroundColor: '#fafafa', opacity: scrollReady ? 1 : 0 }}
          />

          {!scrollReady && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
              <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
          )}
        </>
      )}

      {/* Edit indicator */}
      {editingMessageId && (
        <View className="flex-row items-center justify-between border-b border-primary-100 bg-primary-50 px-4 py-2">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="pencil" size={14} color={COLORS.primary[500]} />
            <Text variant="caption" weight="semibold" color={COLORS.primary[500]}>
              Editing
            </Text>
          </View>
          <TouchableOpacity onPress={cancelEditing} hitSlop={8}>
            <Ionicons name="close" size={18} color={COLORS.primary[400]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Reply indicator */}
      {replyingTo && !editingMessageId && (
        <View className="flex-row items-center border-b border-neutral-200 bg-neutral-50 px-4 py-2">
          <Ionicons name="arrow-undo-outline" size={14} color={COLORS.neutral[400]} style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text
              variant="caption"
              weight="semibold"
              color={COLORS.primary[500]}
              style={{ fontSize: 11, marginBottom: 1 }}
            >
              {getSenderId(replyingTo) === currentUserId ? 'You' : getSenderName(replyingTo.sender)}
            </Text>
            <Text
              variant="caption"
              color={COLORS.neutral[400]}
              numberOfLines={1}
            >
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={cancelReplying} hitSlop={8} style={{ marginLeft: 8 }}>
            <Ionicons name="close" size={18} color={COLORS.neutral[400]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 }}>
        <View className="flex-row items-end">
          <View className="flex-1 flex-row items-end rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
            <RNTextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={editingMessageId ? setEditText : setInputText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.neutral[300]}
              multiline
              maxLength={2000}
              className="max-h-[100px] flex-1 text-[16px] text-neutral-600"
              style={{ paddingVertical: 4 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={inputDisabled}
            style={{
              marginLeft: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              padding: 10,
              backgroundColor: !inputDisabled ? COLORS.primary[500] : COLORS.neutral[200],
            }}
          >
            {sending ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={!inputDisabled ? COLORS.neutral[0] : COLORS.neutral[300]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Long press menu modal */}
      <Modal visible={!!menuMessage} transparent animationType="fade" onRequestClose={() => setMenuMessage(null)}>
        <Pressable className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setMenuMessage(null)}>
          <View className="w-52 rounded-2xl bg-white py-2" style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
            {/* Reply */}
            <TouchableOpacity
              onPress={() => menuMessage && startReplying(menuMessage)}
              className="flex-row items-center px-5 py-3"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo-outline" size={18} color={COLORS.neutral[500]} />
              <Text variant="body" color={COLORS.neutral[600]} style={{ marginLeft: 12 }}>
                Reply
              </Text>
            </TouchableOpacity>

            {/* Edit - own messages only */}
            {menuMessage && getSenderId(menuMessage) === currentUserId && !menuMessage.isDeleted && (
              <TouchableOpacity
                onPress={() => menuMessage && startEditing(menuMessage)}
                className="flex-row items-center px-5 py-3"
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color={COLORS.neutral[500]} />
                <Text variant="body" color={COLORS.neutral[600]} style={{ marginLeft: 12 }}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete - own messages only */}
            {menuMessage && getSenderId(menuMessage) === currentUserId && !menuMessage.isDeleted && (
              <TouchableOpacity
                onPress={() => menuMessage && handleDelete(menuMessage._id)}
                className="flex-row items-center px-5 py-3"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text variant="body" color="#EF4444" style={{ marginLeft: 12 }}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </Wrapper>
  );
}
