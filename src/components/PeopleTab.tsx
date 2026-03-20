import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

const formatLastSeen = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Active now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  if (hours < 24) return `Active ${hours}h ago`;
  if (days < 7) return `Active ${days}d ago`;
  return `Last seen ${date.toLocaleDateString()}`;
};

export default function PeopleTab() {
  const { user: currentUser } = useAuth();
  const { users, openDirectMessage, loading } = useChat();
  const [search, setSearch] = useState("");

  const filtered = users.filter(u => {
    const name = (u.display_name || u.username || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          Members <span className="text-muted-foreground font-normal text-sm">({users.length})</span>
        </h2>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((user) => (
          <button
            key={user.id}
            onClick={() => openDirectMessage(user.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-muted/30 active:scale-[0.99]"
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface font-display text-sm text-primary">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  (user.display_name || user.username || "?").charAt(0).toUpperCase()
                )}
              </div>
              {user.is_online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body text-[15px] font-semibold text-foreground">{user.display_name || user.username}</span>
                {user.id === currentUser?.id && (
                  <span className="text-[9px] text-muted-foreground">(you)</span>
                )}
                <span className={`rounded-full px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider ${
                  user.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
                {user.custom_status || (user.is_online ? "Active now" : formatLastSeen(user.last_seen))}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
