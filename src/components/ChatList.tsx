import { Search } from "lucide-react";
import { mockConversations } from "@/data/mockData";
import { useState } from "react";

interface ChatListProps {
  onSelectChat: (id: string) => void;
  activeChat?: string;
}

const ChatList = ({ onSelectChat, activeChat }: ChatListProps) => {
  const [filter, setFilter] = useState<"all" | "groups" | "direct">("all");
  const [search, setSearch] = useState("");

  const filtered = mockConversations.filter((c) => {
    if (filter === "groups" && c.type !== "group") return false;
    if (filter === "direct" && c.type !== "direct") return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:glow"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-3">
        {(["all", "direct", "groups"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`press rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-all duration-200 ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Chat items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv, i) => (
          <button
            key={conv.id}
            onClick={() => onSelectChat(conv.id)}
            className={`press flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-muted/30 ${
              activeChat === conv.id ? "bg-muted/40" : ""
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface font-display text-sm text-primary">
                {conv.name.charAt(0)}
              </div>
              {conv.type === "direct" && conv.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              )}
              {conv.type === "group" && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-secondary-foreground">
                  {conv.memberCount}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-body text-[15px] font-semibold text-foreground truncate">{conv.name}</span>
                <span className="flex-shrink-0 font-body text-[11px] text-muted-foreground">{conv.lastMessageTime}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-body text-sm text-muted-foreground truncate">{conv.lastMessage}</span>
                {conv.unreadCount > 0 && (
                  <span className="ml-2 flex-shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 font-display text-[10px] text-accent-foreground">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-2xl mb-2">💬</span>
            <p className="font-body text-sm text-muted-foreground">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
