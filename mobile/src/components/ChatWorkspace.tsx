import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import api from '../services/api';
import { getSocket, joinChatRoom } from '../services/socket';
import { ApiEnvelope, ChatMessage, User } from '../types';
import { AppTheme } from '../theme/theme';
import { useThemedStyles } from '../theme/useThemedStyles';
import { extractErrorMessage, formatDateTime, getEntityId } from '../utils/formatters';
import { useAuth } from '../store/AuthContext';
import { EmptyState } from './EmptyState';
import { PrimaryButton } from './PrimaryButton';
import { ScreenLayout } from './ScreenLayout';
import { TextField } from './TextField';

interface ChatWorkspaceProps {
  title: string;
  subtitle: string;
}

export const ChatWorkspace = ({ title, subtitle }: ChatWorkspaceProps) => {
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadContacts = async () => {
    try {
      const response = await api.get<ApiEnvelope<User[]>>('/chat/contacts');
      const nextContacts = response.data.data;

      setContacts(nextContacts);
      setSelectedContact((currentContact) => {
        if (currentContact) {
          return (
            nextContacts.find((contact) => contact._id === currentContact._id) ||
            nextContacts[0] ||
            null
          );
        }

        return nextContacts[0] || null;
      });
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (partnerId: string) => {
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
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact?._id) {
      loadMessages(selectedContact._id);
    }
  }, [selectedContact?._id]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const onNewMessage = (incomingMessage: ChatMessage) => {
      const senderId = getEntityId(incomingMessage.sender);
      const receiverId = getEntityId(incomingMessage.receiver);
      const partnerId = selectedContact?._id;

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

    socket.on('chat:new', onNewMessage);

    return () => {
      socket.off('chat:new', onNewMessage);
    };
  }, [selectedContact?._id]);

  const sendMessage = async () => {
    if (!selectedContact || !draft.trim()) {
      return;
    }

    setSending(true);

    try {
      const response = await api.post<ApiEnvelope<ChatMessage>>(`/chat/${selectedContact._id}`, {
        message: draft.trim(),
      });

      setMessages((currentMessages) => [...currentMessages, response.data.data]);
      setDraft('');
    } catch (sendError) {
      setError(extractErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenLayout title={title} subtitle={subtitle} scroll={false} contentStyle={styles.container}>
      {loading ? (
        <EmptyState title="Loading chats" subtitle="Fetching the latest conversation threads." />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          subtitle="Once an admin or customer account exists, support messages will show up here."
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <FlatList
            data={contacts}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contacts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const active = item._id === selectedContact?._id;
              return (
                <Pressable
                  onPress={() => setSelectedContact(item)}
                  style={[styles.contactChip, active ? styles.contactChipActive : null]}
                >
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactMeta}>{item.role}</Text>
                </Pressable>
              );
            }}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messages}
            renderItem={({ item }) => {
              const isOwnMessage = getEntityId(item.sender) === user?._id;
              return (
                <View style={[styles.messageBubble, isOwnMessage ? styles.messageOwn : styles.messageOther]}>
                  <Text style={styles.messageText}>{item.message}</Text>
                  <Text style={styles.messageTime}>{formatDateTime(item.createdAt)}</Text>
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
          <View style={styles.composer}>
            <TextField
              label="Message"
              multiline
              value={draft}
              onChangeText={setDraft}
              style={styles.composerInput}
            />
            <PrimaryButton label="Send" onPress={sendMessage} loading={sending} />
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
      paddingBottom: theme.spacing.md,
    },
    flex: {
      flex: 1,
      gap: theme.spacing.md,
    },
    contacts: {
      flexGrow: 0,
    },
    contactChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 18,
      borderWidth: 1,
      marginRight: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    contactChipActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceMuted,
    },
    contactName: {
      color: theme.colors.text,
      fontFamily: theme.fontFamily.heading,
      fontSize: 14,
      fontWeight: '700',
    },
    contactMeta: {
      color: theme.colors.textMuted,
      fontSize: 11,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    messages: {
      flexGrow: 1,
      gap: 10,
      paddingBottom: theme.spacing.md,
    },
    messageBubble: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.md,
      maxWidth: '84%',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    messageOwn: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.accentMuted,
    },
    messageOther: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
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
    composer: {
      gap: theme.spacing.sm,
    },
    composerInput: {
      minHeight: 90,
      textAlignVertical: 'top',
    },
    error: {
      color: theme.colors.danger,
    },
  });
