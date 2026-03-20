import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function NewChatSheet({ open, onClose }: NewChatSheetProps) {
  const { users, openDirectMessage } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const filteredUsers = users.filter(u =>
    u.id !== user?.id &&
    ((u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectUser = async (userId: string) => {
    setLoading(userId);
    try {
      await openDirectMessage(userId);
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error('Failed to open DM:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card safe-top">
        <button
          onClick={onClose}
          className="text-muted-foreground text-sm font-medium px-2 py-1 active:scale-95 transition-transform"
        >
          Cancel
        </button>
        <h2 className="text-foreground font-bold text-base font-display">New Chat</h2>
        <div className="w-16" />
      </div>

      <div className="px-4 py-3 border-b border-border">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search people..."
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No users found' : 'No team members available'}
            </p>
          </div>
        ) : (
          filteredUsers.map(u => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u.id)}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/50 transition-colors active:bg-card disabled:opacity-50"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground font-bold">
                      {(u.display_name || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {u.is_online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="text-foreground font-medium text-[15px] truncate">
                  {u.display_name}
                </p>
                <p className="text-muted-foreground text-xs truncate">
                  {u.custom_status || `@${u.username}`}
                </p>
              </div>

              {loading === u.id && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}

              {u.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-primary/15 text-primary uppercase">
                  Admin
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
