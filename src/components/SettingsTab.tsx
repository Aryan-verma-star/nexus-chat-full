import { useState } from "react";
import { LogOut, User, Bell, Palette, HardDrive, Shield, X, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const SettingsTab = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showEditName, setShowEditName] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [showClearCache, setShowClearCache] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.display_name || "");
  const [newStatus, setNewStatus] = useState(user?.custom_status || "");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    messages: true,
    jobs: true,
    sound: true,
  });
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSaveDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;
    setLoading(true);
    try {
      await api.users.update(user.id, { display_name: newDisplayName.trim() });
      await refreshUser();
      setShowEditName(false);
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.users.update(user.id, { custom_status: newStatus.trim() });
      await refreshUser();
      setShowEditStatus(false);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem("nexus_cache");
    localStorage.removeItem("nexus_messages_cache");
    setCacheCleared(true);
    setTimeout(() => {
      setCacheCleared(false);
      setShowClearCache(false);
    }, 1500);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-20">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-display text-lg font-bold text-foreground">Settings</h2>
      </div>

      {/* Profile */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface font-display text-xl text-primary overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="h-full w-full object-cover" />
            ) : (
              (user?.display_name || user?.username || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-body text-lg font-semibold text-foreground">{user?.display_name || user?.username || "User"}</p>
            <p className="font-body text-xs text-muted-foreground">@{user?.username || "username"}</p>
            <p className="font-body text-xs text-primary mt-0.5">{user?.custom_status || "Online"}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-1">
        <SectionHeader icon={User} label="Profile" />
        <SettingsItem label="Edit Display Name" onClick={() => {
          setNewDisplayName(user?.display_name || "");
          setShowEditName(true);
        }} />
        <SettingsItem label="Change Status" onClick={() => {
          setNewStatus(user?.custom_status || "");
          setShowEditStatus(true);
        }} />
        <SettingsItem label="Update Avatar" onClick={() => alert("Avatar upload coming soon!")} />

        <SectionHeader icon={Bell} label="Notifications" />
        <ToggleItem 
          label="Message Notifications" 
          enabled={notifications.messages} 
          onToggle={() => toggleNotification("messages")} 
        />
        <ToggleItem 
          label="Job Notifications" 
          enabled={notifications.jobs} 
          onToggle={() => toggleNotification("jobs")} 
        />
        <ToggleItem 
          label="Sound" 
          enabled={notifications.sound} 
          onToggle={() => toggleNotification("sound")} 
        />

        <SectionHeader icon={Palette} label="Appearance" />
        <SettingsItem label="Theme: Cyber Dark" badge="Active" />
        <SettingsItem label="Font Size: Medium" />

        <SectionHeader icon={HardDrive} label="Storage & Data" />
        <SettingsItem label="Storage Used: 0 MB" />
        <SettingsItem 
          label={cacheCleared ? "Cache Cleared!" : "Clear Cache"} 
          onClick={() => !cacheCleared && setShowClearCache(true)} 
          highlight={cacheCleared}
        />

        {user?.role === "admin" && (
          <>
            <SectionHeader icon={Shield} label="Admin Panel" />
            <SettingsItem label="User Management" onClick={() => alert("User management coming soon!")} />
            <SettingsItem label="Integration Settings" onClick={() => alert("Integration settings coming soon!")} />
            <SettingsItem label="System Logs" onClick={() => alert("System logs coming soon!")} />
          </>
        )}
      </div>

      {/* About */}
      <div className="px-4 py-6 mt-4">
        <p className="font-display text-xs text-muted-foreground text-center">NEXUS v1.0.0</p>
        <p className="font-body text-[11px] text-muted-foreground text-center mt-1">Built with 💚 by the team</p>
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive py-3 font-display text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>

      {/* Edit Display Name Modal */}
      {showEditName && (
        <Modal title="Edit Display Name" onClose={() => setShowEditName(false)}>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs text-muted-foreground mb-1">Display Name</label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground outline-none focus:border-primary"
                placeholder="Enter display name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditName(false)}
                className="px-4 py-2 rounded-lg border border-border font-body text-sm text-muted-foreground hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDisplayName}
                disabled={loading || !newDisplayName.trim()}
                className="px-4 py-2 rounded-lg bg-primary font-body text-sm text-primary-foreground hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Status Modal */}
      {showEditStatus && (
        <Modal title="Change Status" onClose={() => setShowEditStatus(false)}>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs text-muted-foreground mb-1">Custom Status</label>
              <input
                type="text"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground outline-none focus:border-primary"
                placeholder="What's on your mind?"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">{newStatus.length}/100</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowEditStatus(false)}
                className="px-4 py-2 rounded-lg border border-border font-body text-sm text-muted-foreground hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-primary font-body text-sm text-primary-foreground hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Cache Modal */}
      {showClearCache && (
        <Modal title="Clear Cache" onClose={() => setShowClearCache(false)}>
          <div className="space-y-4">
            <p className="font-body text-sm text-muted-foreground">
              This will clear all cached data. You may need to reload some data after this.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearCache(false)}
                className="px-4 py-2 rounded-lg border border-border font-body text-sm text-muted-foreground hover:bg-muted/30"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 rounded-lg bg-destructive font-body text-sm text-destructive-foreground hover:brightness-110"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, label }: { icon: typeof User; label: string }) => (
  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
    <Icon className="h-4 w-4 text-primary" />
    <span className="font-display text-xs uppercase tracking-wider text-primary">{label}</span>
  </div>
);

const SettingsItem = ({ label, badge, onClick, highlight }: { label: string; badge?: string; onClick?: () => void; highlight?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-all duration-200 hover:bg-muted/30 active:scale-[0.99] ${highlight ? "text-green-500" : ""}`}
  >
    <span className="font-body text-sm text-foreground">{label}</span>
    {badge && (
      <span className="rounded-full bg-primary/20 px-2 py-0.5 font-display text-[9px] text-primary uppercase">{badge}</span>
    )}
  </button>
);

const ToggleItem = ({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="font-body text-sm text-foreground">{label}</span>
      <button
        onClick={onToggle}
        className={`h-6 w-10 rounded-full transition-colors duration-200 relative ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
};

const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="relative w-full max-w-md mx-4 bg-background rounded-2xl border border-border p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default SettingsTab;
