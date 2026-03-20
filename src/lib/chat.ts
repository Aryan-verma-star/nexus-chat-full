import { supabase } from './supabase';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  notifications_muted: boolean;
  joined_at: string;
  last_read_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  custom_status: string;
  is_active: boolean;
  permissions: Record<string, boolean>;
  is_online: boolean;
  last_seen: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'image' | 'file' | 'system' | 'voice';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  reply_to: string | null;
  is_deleted: boolean;
  is_edited: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
  reply_message?: Message | null;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: memberships, error: memErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (memErr) throw memErr;
  if (!memberships || memberships.length === 0) return [];

  const ids = memberships.map(m => m.conversation_id);

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        *,
        profile:profiles(id, username, display_name, avatar_url, is_online, last_seen, custom_status)
      )
    `)
    .in('id', ids)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Conversation[];
}

export async function getConversation(convId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        *,
        profile:profiles(id, username, display_name, avatar_url, is_online, last_seen, custom_status)
      )
    `)
    .eq('id', convId)
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function createDirectConversation(userId: string, otherUserId: string): Promise<Conversation> {
  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (myMemberships) {
    for (const mem of myMemberships) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', mem.conversation_id)
        .eq('type', 'direct')
        .single();

      if (conv) {
        const { data: otherMem } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (otherMem) return conv as Conversation;
      }
    }
  }

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: userId })
    .select()
    .single();

  if (convErr) throw convErr;

  const { error: memErr } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: conv.id, user_id: userId, role: 'admin' },
      { conversation_id: conv.id, user_id: otherUserId, role: 'admin' },
    ]);

  if (memErr) throw memErr;
  return conv as Conversation;
}

export async function createGroupConversation(params: {
  name: string;
  description?: string;
  createdBy: string;
  memberIds: string[];
}): Promise<Conversation> {
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      name: params.name,
      description: params.description || null,
      created_by: params.createdBy,
    })
    .select()
    .single();

  if (convErr) throw convErr;

  const allMembers = [params.createdBy, ...params.memberIds.filter(id => id !== params.createdBy)];
  const memberInserts = allMembers.map((uid, i) => ({
    conversation_id: conv.id,
    user_id: uid,
    role: i === 0 ? 'admin' : 'member',
  }));

  const { error: memErr } = await supabase
    .from('conversation_members')
    .insert(memberInserts);

  if (memErr) throw memErr;

  return conv as Conversation;
}

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(id, username, display_name, avatar_url, is_online),
      reactions:message_reactions(id, emoji, user_id)
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as Message[]).reverse();
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content?: string;
  type?: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: string;
}): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      content: params.content || null,
      type: params.type || 'text',
      file_url: params.fileUrl || null,
      file_name: params.fileName || null,
      file_size: params.fileSize || null,
      file_type: params.fileType || null,
      reply_to: params.replyTo || null,
    })
    .select(`
      *,
      sender:profiles!sender_id(id, username, display_name, avatar_url, is_online)
    `)
    .single();

  if (error) throw error;
  return data as Message;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true, content: null, file_url: null })
    .eq('id', messageId);

  if (error) throw error;
}

export async function editMessage(messageId: string, newContent: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ content: newContent, is_edited: true })
    .eq('id', messageId);

  if (error) throw error;
}

export async function addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .upsert(
      { message_id: messageId, user_id: userId, emoji },
      { onConflict: 'message_id,user_id,emoji' }
    );

  if (error) throw error;
}

export async function removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
}

export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}

export async function setTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
  await supabase
    .from('typing_indicators')
    .upsert(
      { conversation_id: conversationId, user_id: userId, is_typing: isTyping, updated_at: new Date().toISOString() },
      { onConflict: 'conversation_id,user_id' }
    );
}

export async function uploadFile(
  file: File,
  conversationId: string,
  userId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const path = `${conversationId}/${userId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from('nexus-files')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from('nexus-files')
    .getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return (data || []) as UserProfile[];
}

export async function updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  await supabase
    .from('profiles')
    .update({ is_online: isOnline, last_seen: new Date().toISOString() })
    .eq('id', userId);
}

export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: any) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!sender_id(id, username, display_name, avatar_url, is_online)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) onNewMessage(data);
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToConversationUpdates(
  userId: string,
  onUpdate: (conversation: any) => void
) {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return channel;
}

export function subscribeToTyping(
  conversationId: string,
  onTyping: (data: { user_id: string; is_typing: boolean }) => void
) {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onTyping(payload.new as any);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribe(channel: any) {
  supabase.removeChannel(channel);
}
