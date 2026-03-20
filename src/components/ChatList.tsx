import { useState } from "react";
import { Search, Plus, X, Users, User } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import type { Conversation, UserProfile } from "../lib/chat";

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

const getConvDisplayName = (conv: Conversation, currentUserId: string): string => {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.members?.find(m => m.user_id !== currentUserId);
  return other?.profile?.display_name || other?.profile?.username || "Direct Chat";
};

const getAvatarChar = (conv: Conversation, currentUserId: string): string => {
  const name = getConvDisplayName(conv, currentUserId);
  return name.charAt(0).toUpperCase();
};

export default function ChatList() {
  const { user } = useAuth();
  const {
    conversations, users, activeConversation,
    setActiveConversation, openDirectMessage, createGroup,
    loading,
  } = useChat();

  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "groups" | "direct">("all");

  const currentUserId = user?.id || "";

  const filtered = conversations.filter((c) => {
    if (filter === "groups" && c.type !== "group") return false;
    if (filter === "direct" && c.type !== "direct") return false;
    const name = getConvDisplayName(c, currentUserId);
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    if (search) {
      const name = (u.display_name || u.username || "").toLowerCase();
      return name.includes(search.toLowerCase());
    }
    return true;
  });

  const handleSelectConv = (conv: Conversation) => {
    setActiveConversation(conv);
  };

  const handleNewChat = async (userId: string) => {
    setShowNewChat(false);
    setSearch("");
    await openDirectMessage(userId);
  };

  const handleNewGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setShowNewGroup(false);
    setGroupName("");
    setSelectedMembers([]);
    setSearch("");
    await createGroup(groupName.trim(), selectedMembers);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <div className="flex gap-2">
          {(["all", "direct", "groups"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
            title="New chat"
          >
            <User className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary active:scale-95"
            title="New group"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-2xl mb-2">💬</span>
            <p className="font-body text-sm text-muted-foreground">No conversations found</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-3 rounded-full bg-primary px-4 py-2 font-display text-xs text-primary-foreground"
            >
              Start a chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            const displayName = getConvDisplayName(conv, currentUserId);
            const avatarChar = getAvatarChar(conv, currentUserId);
            const otherMember = conv.members?.find(m => m.user_id !== currentUserId);
            const isOnline = conv.type === "direct" && otherMember?.profile?.is_online;

            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-muted/30 active:scale-[0.99] ${
                  isActive ? "bg-muted/50" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface font-display text-sm text-primary">
                    {avatarChar}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  )}
                  {conv.type === "group" && conv.members && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-secondary-foreground">
                      {conv.members.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[15px] font-semibold text-foreground truncate">
                      {displayName}
                    </span>
                    <span className="flex-shrink-0 font-body text-[11px] text-muted-foreground">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-body text-sm text-muted-foreground truncate">
                      {conv.last_message_preview || "No messages yet"}
                    </span>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="ml-2 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-accent px-1.5 font-display text-[10px] text-accent-foreground">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => { setShowNewChat(false); setSearch(""); }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border-t border-border bg-card p-4 pt-6 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-foreground">New Chat</h3>
              <button
                onClick={() => { setShowNewChat(false); setSearch(""); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredUsers.length === 0 ? (
                <p className="py-6 text-center font-body text-sm text-muted-foreground">No users found</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleNewChat(u.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface font-display text-xs text-primary">
                        {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                      </div>
                      {u.is_online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-foreground truncate">
                        {u.display_name || u.username}
                      </p>
                      <p className="font-body text-xs text-muted-foreground truncate">
                        {u.is_online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
          onClick={() => { setShowNewGroup(false); setGroupName(""); setSelectedMembers([]); setSearch(""); }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border-t border-border bg-card p-4 pt-6 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-foreground">New Group</h3>
              <button
                onClick={() => { setShowNewGroup(false); setGroupName(""); setSelectedMembers([]); setSearch(""); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            {selectedMembers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {selectedMembers.map((id) => {
                  const u = users.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 font-display text-[10px] text-primary"
                    >
                      {u.display_name || u.username}
                      <button
                        onClick={() => toggleMember(id)}
                        className="ml-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selectedMembers.includes(u.id)
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-border">
                    {selectedMembers.includes(u.id) && (
                      <span className="text-[10px] text-primary">✓</span>
                    )}
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface font-display text-xs text-primary flex-shrink-0">
                    {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">
                      {u.display_name || u.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleNewGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
              className="w-full rounded-xl bg-gradient-sent py-3 font-display text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
