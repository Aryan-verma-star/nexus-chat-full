import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  Conversation, Message, UserProfile,
  getConversations, getMessages, sendMessage as sendMsg,
  createDirectConversation, createGroupConversation,
  subscribeToMessages, subscribeToConversationUpdates,
  subscribeToTyping, unsubscribe, markAsRead,
  setTyping as setTypingApi, uploadFile, getAllUsers,
  updateOnlineStatus, deleteMessage, editMessage,
  addReaction, removeReaction, getConversation,
} from '../lib/chat';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  users: UserProfile[];
  typingUsers: string[];
  loading: boolean;
  messagesLoading: boolean;
  sendingMessage: boolean;
  error: string | null;
  setActiveConversation: (conv: Conversation | null) => void;
  openDirectMessage: (userId: string) => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<void>;
  sendTextMessage: (content: string, replyTo?: string) => Promise<void>;
  sendFileMessage: (file: File) => Promise<void>;
  deleteMsg: (messageId: string) => Promise<void>;
  editMsg: (messageId: string, content: string) => Promise<void>;
  addMessageReaction: (messageId: string, emoji: string) => Promise<void>;
  removeMessageReaction: (messageId: string, emoji: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  setTypingStatus: (isTyping: boolean) => void;
  refreshConversations: () => Promise<void>;
  hasMore: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const user = auth?.user;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const messageChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const convChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const [convs, allUsers] = await Promise.all([
        getConversations(user.id),
        getAllUsers(),
      ]);
      setConversations(convs);
      setUsers(allUsers.filter(u => u.id !== user.id));
    } catch (err: any) {
      console.error('[Chat] Failed to load conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshConversations();
      updateOnlineStatus(user.id, true);

      convChannelRef.current = subscribeToConversationUpdates(user.id, () => {
        refreshConversations();
      });

      return () => {
        updateOnlineStatus(user.id, false);
        if (convChannelRef.current) unsubscribe(convChannelRef.current);
      };
    }
  }, [user, refreshConversations]);

  const setActiveConversation = useCallback(async (conv: Conversation | null) => {
    if (messageChannelRef.current) unsubscribe(messageChannelRef.current);
    if (typingChannelRef.current) unsubscribe(typingChannelRef.current);
    setTypingUsers([]);

    setActiveConversationState(conv);
    setMessages([]);
    setHasMore(true);

    if (!conv || !user) return;

    setMessagesLoading(true);
    try {
      const msgs = await getMessages(conv.id, 50);
      setMessages(msgs);
      setHasMore(msgs.length >= 50);

      await markAsRead(conv.id, user.id);

      messageChannelRef.current = subscribeToMessages(conv.id, (newMsg) => {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markAsRead(conv.id, user.id);
        refreshConversations();
      });

      typingChannelRef.current = subscribeToTyping(conv.id, (data) => {
        if (data.user_id === user.id) return;
        setTypingUsers(prev => {
          if (data.is_typing) {
            return prev.includes(data.user_id) ? prev : [...prev, data.user_id];
          } else {
            return prev.filter(id => id !== data.user_id);
          }
        });
      });
    } catch (err: any) {
      console.error('[Chat] Failed to load messages:', err);
      setError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  }, [user, refreshConversations]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || !hasMore || messagesLoading) return;
    const oldest = messages[0];
    if (!oldest) return;

    setMessagesLoading(true);
    try {
      const older = await getMessages(activeConversation.id, 50, oldest.created_at);
      if (older.length < 50) setHasMore(false);
      setMessages(prev => [...older, ...prev]);
    } catch (err: any) {
      console.error('[Chat] Failed to load more messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [activeConversation, hasMore, messagesLoading, messages]);

  const sendTextMessage = useCallback(async (content: string, replyTo?: string) => {
    if (!activeConversation || !user || !content.trim()) return;
    setSendingMessage(true);
    try {
      const msg = await sendMsg({
        conversationId: activeConversation.id,
        senderId: user.id,
        content: content.trim(),
        replyTo,
      });
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTypingApi(activeConversation.id, user.id, false);
    } catch (err: any) {
      console.error('[Chat] Failed to send message:', err);
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation, user]);

  const sendFileMessage = useCallback(async (file: File) => {
    if (!activeConversation || !user) return;
    setSendingMessage(true);
    try {
      const { url } = await uploadFile(file, activeConversation.id, user.id);
      const isImage = file.type.startsWith('image/');
      const msg = await sendMsg({
        conversationId: activeConversation.id,
        senderId: user.id,
        content: isImage ? '' : file.name,
        type: isImage ? 'image' : 'file',
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      console.error('[Chat] Failed to send file:', err);
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation, user]);

  const deleteMsg = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const editMsg = useCallback(async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content, is_edited: true } : m
      ));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const addMessageReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await addReaction(messageId, user.id, emoji);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const removeMessageReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await removeReaction(messageId, user.id, emoji);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  const openDirectMessage = useCallback(async (otherUserId: string) => {
    if (!user) return;
    try {
      const conv = await createDirectConversation(user.id, otherUserId);
      const fullConv = await getConversation(conv.id);
      await refreshConversations();
      setActiveConversation(fullConv);
    } catch (err: any) {
      console.error('[Chat] Failed to create DM:', err);
      setError(err.message);
    }
  }, [user, refreshConversations, setActiveConversation]);

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    if (!user) return;
    try {
      const conv = await createGroupConversation({
        name,
        createdBy: user.id,
        memberIds,
      });
      const fullConv = await getConversation(conv.id);
      await refreshConversations();
      setActiveConversation(fullConv);
    } catch (err: any) {
      console.error('[Chat] Failed to create group:', err);
      setError(err.message);
    }
  }, [user, refreshConversations, setActiveConversation]);

  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (!activeConversation || !user) return;
    setTypingApi(activeConversation.id, user.id, isTyping);

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingApi(activeConversation.id, user.id, false);
      }, 3000);
    }
  }, [activeConversation, user]);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, messages, users, typingUsers,
      loading, messagesLoading, sendingMessage, error, hasMore,
      setActiveConversation, openDirectMessage, createGroup,
      sendTextMessage, sendFileMessage, deleteMsg, editMsg,
      addMessageReaction, removeMessageReaction,
      loadMoreMessages, setTypingStatus, refreshConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
