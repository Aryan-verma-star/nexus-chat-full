import { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import NewChatSheet from './NewChatSheet';
import CreateGroupSheet from './CreateGroupSheet';
import type { Conversation } from '../lib/chat';

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function ChatList() {
  const { conversations, setActiveConversation, loading } = useChat();
  const { user } = useAuth();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all');

  useEffect(() => {
    if (conversations.length > 0) {
      console.log('[ChatList] Loaded', conversations.length, 'conversations:');
      conversations.forEach(c => {
        const memberCount = c.members?.length || 0;
        const names = c.members?.map(m => m.profile?.display_name || m.user_id).join(', ') || '(no members)';
        console.log(`  ${c.id.slice(0,8)}: type=${c.type} name="${c.name || ''}" members=${memberCount} [${names}]`);
      });
    }
  }, [conversations]);

  const getOtherMember = (conv: Conversation) => {
    if (!conv.members || conv.members.length === 0) return null;
    return conv.members.find(m => {
      const memberId = m.user_id || (m.profile as any)?.id;
      return memberId !== user?.id;
    }) || null;
  };

  const getDisplayName = (conv: Conversation): string => {
    if (conv.type === 'group') {
      return conv.name || 'Unnamed Group';
    }

    const other = getOtherMember(conv);

    if (other?.profile?.display_name) {
      return other.profile.display_name;
    }
    if (other?.profile?.username) {
      return other.profile.username;
    }
    if (other?.user_id) {
      return `[User ${other.user_id.slice(0, 8)}]`;
    }
    if (conv.last_message_sender && conv.last_message_sender !== user?.display_name) {
      return conv.last_message_sender;
    }
    return '(No name)';
  };

  const getAvatarUrl = (conv: Conversation): string | null => {
    if (conv.type === 'group') return conv.avatar_url || null;
    const other = getOtherMember(conv);
    return other?.profile?.avatar_url || null;
  };

  const getInitial = (conv: Conversation): string => {
    return getDisplayName(conv)[0]?.toUpperCase() || '?';
  };

  const isOnline = (conv: Conversation): boolean => {
    if (conv.type === 'group') return false;
    const other = getOtherMember(conv);
    return other?.profile?.is_online || false;
  };

  const filtered = conversations
    .filter(c => {
      if (filter === 'direct') return c.type === 'direct';
      if (filter === 'group') return c.type === 'group';
      return true;
    })
    .filter(c => {
      if (c.type === 'direct' && (!c.members || c.members.length < 2)) {
        console.warn('[ChatList] Filtering out broken DM:', c.id);
        return false;
      }
      return true;
    });

  if (loading) {
    return (
      <div className="h-full overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto no-scrollbar">
        {(['all', 'direct', 'group'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground border border-border'
            }`}
          >
            {f === 'all' ? 'All' : f === 'direct' ? 'Direct' : 'Groups'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-20">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-foreground font-semibold text-base mb-1">No conversations yet</p>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Start chatting with your team
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              Start a Chat
            </button>
          </div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/30 transition-colors active:bg-card"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {conv.type === 'group' ? (
                    <span className="text-lg">👥</span>
                  ) : getAvatarUrl(conv) ? (
                    <img src={getAvatarUrl(conv)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground font-bold text-sm">{getInitial(conv)}</span>
                  )}
                </div>
                {isOnline(conv) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground font-semibold text-[15px] truncate">
                    {getDisplayName(conv)}
                  </p>
                  <span className="text-muted-foreground text-[11px] flex-shrink-0">
                    {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-muted-foreground text-[13px] truncate">
                    {conv.last_message_preview
                      ? (conv.type === 'group' && conv.last_message_sender
                          ? `${conv.last_message_sender}: ${conv.last_message_preview}`
                          : conv.last_message_preview)
                      : 'No messages yet'}
                  </p>
                  {(conv.unread_count || 0) > 0 && (
                    <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-display text-[10px] text-primary-foreground">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="absolute bottom-20 right-4 flex flex-col items-end gap-2 z-10">
        {showFab && (
          <>
            <button
              onClick={() => { setShowFab(false); setShowNewChat(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-sm">💬</span>
              <span className="text-foreground text-sm font-medium">New Chat</span>
            </button>
            <button
              onClick={() => { setShowFab(false); setShowNewGroup(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-sm">👥</span>
              <span className="text-foreground text-sm font-medium">New Group</span>
            </button>
          </>
        )}
        <button
          onClick={() => setShowFab(!showFab)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-2xl font-light active:scale-90 transition-transform"
        >
          {showFab ? '×' : '+'}
        </button>
      </div>

      <NewChatSheet open={showNewChat} onClose={() => setShowNewChat(false)} />
      <CreateGroupSheet open={showNewGroup} onClose={() => setShowNewGroup(false)} />
    </div>
  );
}
