import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../services/api';
import { getSocket, joinChatRoom } from '../services/socket';
import { ApiEnvelope, ChatMessage, ChatThread, User } from '../types';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { extractErrorMessage, formatDateTime, getEntityId } from '../utils/formatters';
import { useAuth } from '../store/AuthContext';
import { AppIcon } from './AppIcon';
import { EmptyState } from './EmptyState';
import { ScreenLayout } from './ScreenLayout';
import { SkeletonBlock } from './SkeletonBlock';
import { useAppTheme } from '../theme/ThemeProvider';

interface ChatWorkspaceProps {
  title: string;
  subtitle: string;
}

const buildInitials = (name?: string) =>
  (name || 'Loka')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('');

const combineContacts = (contacts: User[], threads: ChatThread[]) => {
  const registry = new Map<string, User>();

  threads.forEach((thread) => {
    registry.set(thread.partner._id, thread.partner);
  });

  contacts.forEach((contact) => {
    registry.set(contact._id, registry.get(contact._id) || contact);
  });

  return Array.from(registry.values());
};

export const ChatWorkspace = ({ title: _title, subtitle: _subtitle }: ChatWorkspaceProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const messageListRef = useRef<FlatList<ChatMessage>>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(Boolean(getSocket()?.connected));

  const conversationCards = useMemo<ChatThread[]>(
    () =>
      threads.length
        ? threads
        : contacts.map((contact) => ({
            roomKey: contact._id,
            partner: contact,
            lastMessage: null,
          })),
    [contacts, threads],
  );

  const activeThread = useMemo(
    () => threads.find((thread) => thread.partner._id === selectedContact?._id) || null,
    [selectedContact?._id, threads],
  );

  const syncInbox = useCallback(async () => {
    try {
      setError('');
      const [contactsResult, threadsResult] = await Promise.allSettled([
        api.get<ApiEnvelope<User[]>>('/chat/contacts'),
        api.get<ApiEnvelope<ChatThread[]>>('/chat/threads'),
      ]);

      const nextContacts =
        contactsResult.status === 'fulfilled' ? contactsResult.value.data.data : [];
      const nextThreads =
        threadsResult.status === 'fulfilled' ? threadsResult.value.data.data : [];
      const mergedContacts = combineContacts(nextContacts, nextThreads);

      setContacts(mergedContacts);
      setThreads(nextThreads);

      setSelectedContact((currentContact) => {
        const currentContactId = currentContact?._id;

        if (currentContactId) {
          return (
            mergedContacts.find((contact) => contact._id === currentContactId) ||
            nextThreads.find((thread) => thread.partner._id === currentContactId)?.partner ||
            mergedContacts[0] ||
            null
          );
        }

        if (currentContact) {
          return (
            mergedContacts.find((contact) => contact._id === currentContact._id) ||
            nextThreads[0]?.partner ||
            mergedContacts[0] ||
            null
          );
        }

        return nextThreads[0]?.partner || mergedContacts[0] || null;
      });

      if (
        contactsResult.status === 'rejected' &&
        threadsResult.status === 'rejected'
      ) {
        throw contactsResult.reason;
      }
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      setError('');
      const response = await api.get<
        ApiEnvelope<{
          partner: User;
          roomKey: string;
          messages: ChatMessage[];
        }>
      >(`/chat/${partnerId}`);

      setMessages(response.data.data.messages);
      joinChatRoom(partnerId);
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    }
  }, []);

  useEffect(() => {
    syncInbox();
  }, [syncInbox]);

  useEffect(() => {
    if (selectedContact?._id) {
      loadMessages(selectedContact._id);
    }
  }, [loadMessages, selectedContact?._id]);

  useFocusEffect(
    useCallback(() => {
      const intervalId = setInterval(() => {
        syncInbox();

        if (selectedContact?._id) {
          loadMessages(selectedContact._id);
        }
      }, 3500);

      return () => clearInterval(intervalId);
    }, [loadMessages, selectedContact?._id, syncInbox]),
  );

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const timeoutId = setTimeout(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    setSocketConnected(socket.connected);

    const upsertThread = (incomingMessage: ChatMessage) => {
      const partner =
        getEntityId(incomingMessage.sender) === user?._id
          ? incomingMessage.receiver
          : incomingMessage.sender;

      setThreads((currentThreads) => [
        {
          roomKey: incomingMessage.roomKey,
          partner,
          lastMessage: incomingMessage,
        },
        ...currentThreads.filter((thread) => thread.partner._id !== partner._id),
      ]);

      setContacts((currentContacts) =>
        currentContacts.some((contact) => contact._id === partner._id)
          ? currentContacts
          : [partner, ...currentContacts],
      );
    };

    const onNewMessage = (incomingMessage: ChatMessage) => {
      const senderId = getEntityId(incomingMessage.sender);
      const receiverId = getEntityId(incomingMessage.receiver);
      const partnerId = selectedContact?._id;

      upsertThread(incomingMessage);

      if (!partnerId || (senderId !== partnerId && receiverId !== partnerId)) {
        return;
      }

      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message._id === incomingMessage._id)) {
          return currentMessages;
        }

        return [...currentMessages, incomingMessage];
      });
    };

    const onConnect = () => {
      setSocketConnected(true);

      if (selectedContact?._id) {
        joinChatRoom(selectedContact._id);
        loadMessages(selectedContact._id);
      }

      syncInbox();
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:new', onNewMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:new', onNewMessage);
    };
  }, [loadMessages, selectedContact?._id, syncInbox, user?._id]);

  const sendMessage = async () => {
    if (!selectedContact || !draft.trim()) {
      return;
    }

    setSending(true);

    try {
      setError('');
      const response = await api.post<ApiEnvelope<ChatMessage>>(`/chat/${selectedContact._id}`, {
        message: draft.trim(),
      });

      setMessages((currentMessages) =>
        currentMessages.some((message) => message._id === response.data.data._id)
          ? currentMessages
          : [...currentMessages, response.data.data],
      );
      setThreads((currentThreads) => [
        {
          roomKey: response.data.data.roomKey,
          partner: selectedContact,
          lastMessage: response.data.data,
        },
        ...currentThreads.filter((thread) => thread.partner._id !== selectedContact._id),
      ]);
      setDraft('');
    } catch (sendError) {
      setError(extractErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const sendDisabled = !selectedContact || !draft.trim() || sending;
  return (
    <ScreenLayout scroll={false} contentStyle={styles.container}>
      {loading ? (
        <View style={styles.loadingShell}>
          <View style={styles.storyHeader}>
            <View>
              <SkeletonBlock height={12} style={styles.skeletonEyebrow} width={110} />
              <SkeletonBlock height={30} style={styles.skeletonTitle} width={180} />
            </View>
            <SkeletonBlock height={36} radius={18} width={36} />
          </View>
          <View style={styles.loadingStories}>
            {[0, 1, 2].map((item) => (
              <View key={`story-skeleton-${item}`} style={styles.loadingStory}>
                <SkeletonBlock height={64} radius={32} width={64} />
                <SkeletonBlock height={12} style={styles.skeletonText} width={72} />
                <SkeletonBlock height={10} width={52} />
              </View>
            ))}
          </View>
          <View style={styles.loadingMessages}>
            <SkeletonBlock height={74} radius={20} width="72%" />
            <SkeletonBlock height={74} radius={20} style={styles.loadingOwnMessage} width="62%" />
            <SkeletonBlock height={74} radius={20} width="68%" />
          </View>
        </View>
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          subtitle="Once an admin or customer account exists, support messages will show up here."
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 92 : 0}
          style={styles.flex}
        >
          <View style={styles.threadRail}>
            <View style={styles.storyHeader}>
              <View>
                <Text style={styles.storyEyebrow}>Conversations</Text>
                <Text style={styles.storyTitle}>Open threads</Text>
              </View>
              <View style={styles.livePill}>
                <View style={[styles.liveDot, !socketConnected ? styles.liveDotOffline : null]} />
                <Text style={styles.liveLabel}>{socketConnected ? 'Live' : 'Reconnecting'}</Text>
              </View>
            </View>
            <FlatList
              data={conversationCards}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storyStrip}
              keyExtractor={(item) => `story-${item.roomKey}`}
              renderItem={({ item }) => {
                const active = item.partner._id === selectedContact?._id;

                return (
                  <Pressable
                    onPress={() => setSelectedContact(item.partner)}
                    style={styles.storyCard}
                  >
                    <View style={[styles.storyRing, active ? styles.storyRingActive : null]}>
                      <View style={styles.storyAvatar}>
                        <Text style={styles.storyAvatarLabel}>{buildInitials(item.partner.name)}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={[styles.storyName, active ? styles.storyNameActive : null]}>
                      {item.partner.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.storyMeta}>
                      {item.partner.role}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <AppIcon name="alert-circle-outline" size={18} color={theme.colors.danger} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
          <FlatList
            ref={messageListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            style={styles.messageList}
            contentContainerStyle={styles.messages}
            renderItem={({ item }) => {
              const isOwnMessage = getEntityId(item.sender) === user?._id;
              return (
                <View style={[styles.messageRow, isOwnMessage ? styles.messageRowOwn : null]}>
                  {!isOwnMessage ? (
                    <View style={styles.messageAvatar}>
                      <Text style={styles.messageAvatarLabel}>{buildInitials(item.sender.name)}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.messageBubble, isOwnMessage ? styles.messageOwn : styles.messageOther]}>
                    {!isOwnMessage ? <Text style={styles.messageAuthor}>{item.sender.name}</Text> : null}
                    <Text style={styles.messageText}>{item.message}</Text>
                    <Text style={styles.messageTime}>{formatDateTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                title="Start the conversation"
                subtitle="Use the composer below to send the first message."
              />
            }
          />
          <View style={styles.composerShell}>
            <View style={styles.composerInputShell}>
              <AppIcon name="chatbubble-ellipses-outline" size={18} color={theme.colors.textMuted} />
              <TextInput
                multiline
                placeholder={
                  selectedContact
                    ? `Reply to ${selectedContact.name}${activeThread?.lastMessage ? ` · ${activeThread.lastMessage.message.slice(0, 18)}${activeThread.lastMessage.message.length > 18 ? '…' : ''}` : ''}`
                    : 'Select a conversation'
                }
                placeholderTextColor={theme.colors.textMuted}
                style={styles.composerInput}
                value={draft}
                onChangeText={setDraft}
                textAlignVertical="top"
              />
            </View>
            <Pressable
              disabled={sendDisabled}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                sendDisabled ? styles.sendButtonDisabled : null,
                pressed && !sendDisabled ? styles.sendButtonPressed : null,
              ]}
            >
              {sending ? (
                <ActivityIndicator color={theme.colors.textOnAccent} />
              ) : (
                <AppIcon name="arrow-up-outline" size={20} color={theme.colors.textOnAccent} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenLayout>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
    },
    flex: {
      flex: 1,
      gap: theme.spacing.sm,
    },
    loadingMessages: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    loadingOwnMessage: {
      alignSelf: 'flex-end',
    },
    loadingShell: {
      gap: theme.spacing.md,
    },
    loadingStories: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    loadingStory: {
      alignItems: 'center',
      gap: 8,
    },
    liveDot: {
      backgroundColor: theme.colors.success,
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    liveDotOffline: {
      backgroundColor: theme.colors.warning,
    },
    liveLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    livePill: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 34,
      paddingHorizontal: 12,
    },
    skeletonEyebrow: {
      marginBottom: 8,
    },
    skeletonText: {
      marginTop: 2,
    },
    skeletonTitle: {
      marginBottom: 2,
    },
    threadRail: {
      gap: theme.spacing.sm,
    },
    storyHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    storyEyebrow: {
      color: theme.colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.8,
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    storyTitle: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 16,
      fontWeight: '700',
    },
    storyStrip: {
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.sm,
      paddingVertical: 2,
    },
    storyCard: {
      alignItems: 'center',
      width: 68,
    },
    storyRing: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 62,
      justifyContent: 'center',
      marginBottom: 6,
      width: 62,
    },
    storyRingActive: {
      borderColor: theme.colors.accent,
      borderWidth: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    storyAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.accentMuted,
      borderRadius: 999,
      height: 50,
      justifyContent: 'center',
      width: 50,
    },
    storyAvatarLabel: {
      color: theme.colors.accent,
      fontFamily: theme.fontFamily.heading,
      fontSize: 18,
      fontWeight: '700',
    },
    storyName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    storyNameActive: {
      color: theme.colors.accent,
    },
    storyMeta: {
      color: theme.colors.textMuted,
      fontSize: 10,
      textTransform: 'uppercase',
    },
    errorBanner: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.danger,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messages: {
      flexGrow: 1,
      gap: 10,
      paddingBottom: theme.spacing.md,
      paddingTop: 2,
    },
    messageList: {
      flex: 1,
    },
    messageRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 10,
    },
    messageRowOwn: {
      justifyContent: 'flex-end',
    },
    messageAvatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    messageAvatarLabel: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
    },
    messageBubble: {
      alignSelf: 'flex-start',
      borderRadius: 20,
      maxWidth: '84%',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    messageOwn: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.accentMuted,
      borderBottomRightRadius: 8,
    },
    messageOther: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 8,
      borderWidth: 1,
    },
    messageAuthor: {
      color: theme.colors.textMuted,
      fontFamily: theme.fontFamily.heading,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    messageText: {
      color: theme.colors.text,
      lineHeight: 20,
    },
    messageTime: {
      color: theme.colors.textMuted,
      fontSize: 11,
      marginTop: 8,
    },
    composerShell: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    composerInputShell: {
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 10,
      minHeight: 64,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
    },
    composerInput: {
      color: theme.colors.text,
      flex: 1,
      fontFamily: theme.fontFamily.body,
      maxHeight: 110,
      minHeight: 40,
      padding: 0,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      borderRadius: 18,
      height: 52,
      justifyContent: 'center',
      width: 52,
    },
    sendButtonDisabled: {
      opacity: 0.45,
    },
    sendButtonPressed: {
      opacity: 0.85,
    },
    error: {
      color: theme.colors.danger,
      flex: 1,
    },
  });
