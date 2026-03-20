import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

interface CreateGroupSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupSheet({ open, onClose }: CreateGroupSheetProps) {
  const { users, createGroup } = useChat();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const filteredUsers = users.filter(u =>
    u.id !== user?.id &&
    ((u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setCreating(true);
    try {
      await createGroup(groupName.trim(), selectedMembers);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      setStep(1);
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setGroupDescription('');
    setSelectedMembers([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card safe-top">
        <button
          onClick={step === 2 ? () => setStep(1) : handleClose}
          className="text-muted-foreground text-sm font-medium px-2 py-1 active:scale-95 transition-transform"
        >
          {step === 2 ? '← Back' : 'Cancel'}
        </button>
        <h2 className="text-foreground font-bold text-base font-display">
          {step === 1 ? 'New Group' : 'Add Members'}
        </h2>
        <div className="w-16 text-right">
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!groupName.trim()}
              className={`text-sm font-semibold px-2 py-1 transition-colors ${
                groupName.trim() ? 'text-primary active:scale-95' : 'text-muted-foreground opacity-40'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={selectedMembers.length === 0 || creating}
              className={`text-sm font-semibold px-2 py-1 transition-colors ${
                selectedMembers.length > 0 && !creating ? 'text-primary active:scale-95' : 'text-muted-foreground opacity-40'
              }`}
            >
              {creating ? '...' : 'Create'}
            </button>
          )}
        </div>
      </div>

      {step === 1 && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-wider font-display">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value.slice(0, 50))}
              placeholder="Enter group name"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {groupName.length}/50
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-wider font-display">
              Description (optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={e => setGroupDescription(e.target.value.slice(0, 200))}
              placeholder="What is this group about?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="mt-8 p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-display uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                👥
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">
                  {groupName || 'Group Name'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {groupDescription || 'No description'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedMembers.length > 0 && (
            <div className="px-4 py-3 border-b border-border">
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(memberId => {
                  const memberUser = users.find(u => u.id === memberId);
                  if (!memberUser) return null;
                  return (
                    <div
                      key={memberId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30"
                    >
                      <span className="text-primary text-xs font-medium">
                        {memberUser.display_name}
                      </span>
                      <button
                        onClick={() => toggleMember(memberId)}
                        className="text-primary/60 hover:text-primary text-sm leading-none active:scale-90 transition-transform"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <div className="px-4 py-3 border-b border-border">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">No members found</p>
              </div>
            ) : (
              filteredUsers.map(u => {
                const isSelected = selectedMembers.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors active:scale-[0.98] ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-foreground font-bold text-sm">
                            {(u.display_name || '?')[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {u.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">
                        {u.display_name}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        @{u.username}
                      </p>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 bg-transparent'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="safe-bottom" />
    </div>
  );
}
