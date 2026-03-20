import { useState, useRef, useEffect, useCallback } from "react";
import {
  User,
  Bell,
  Palette,
  HardDrive,
  Shield,
  Lock,
  Info,
  LogOut,
  Camera,
  ChevronRight,
  Terminal,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, User as ProfileUser } from "@/lib/supabase";
import { toast } from "sonner";
import { ToggleSwitch } from "./settings/ToggleSwitch";
import { ConfirmDialog } from "./settings/ConfirmDialog";
import { AdminTerminal } from "./settings/AdminTerminal";
import { UserManagementModal } from "./settings/UserManagementModal";
import { IntegrationCards } from "./settings/IntegrationCards";
import { SystemLogs } from "./settings/SystemLogs";

interface NotificationPrefs {
  push: boolean;
  messages: boolean;
  jobs: boolean;
  sound: boolean;
  vibration: boolean;
}

interface AppearancePrefs {
  theme: string;
  fontSize: string;
  reducedMotion: boolean;
}

const THEMES = {
  cyber: {
    name: "Cyber",
    bgPrimary: "#0a0a0f",
    bgSecondary: "#12121a",
    accentPrimary: "#00ff88",
    accentSecondary: "#0ea5e9",
  },
  midnight: {
    name: "Midnight",
    bgPrimary: "#0d1117",
    bgSecondary: "#161b22",
    accentPrimary: "#58a6ff",
    accentSecondary: "#3fb950",
  },
  phantom: {
    name: "Phantom",
    bgPrimary: "#13111c",
    bgSecondary: "#1a1730",
    accentPrimary: "#a78bfa",
    accentSecondary: "#f472b6",
  },
};

const FONT_SIZES = {
  small: "13px",
  medium: "14px",
  large: "16px",
};

const SettingsTab = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [customStatus, setCustomStatus] = useState(user?.custom_status || "");
  const [originalDisplayName, setOriginalDisplayName] = useState(user?.display_name || "");
  const [originalStatus, setOriginalStatus] = useState(user?.custom_status || "");
  const [saving, setSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(() => {
    const stored = localStorage.getItem("nexus_notification_prefs");
    return stored
      ? JSON.parse(stored)
      : {
          push: false,
          messages: true,
          jobs: true,
          sound: true,
          vibration: false,
        };
  });

  const [appearancePrefs, setAppearancePrefs] = useState<AppearancePrefs>(() => {
    const stored = localStorage.getItem("nexus_appearance_prefs");
    return stored
      ? JSON.parse(stored)
      : {
          theme: "cyber",
          fontSize: "medium",
          reducedMotion: false,
        };
  });

  const [storageUsed, setStorageUsed] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showTerminalButton, setShowTerminalButton] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [showDeleteData, setShowDeleteData] = useState(false);
  const [deleteDataLoading, setDeleteDataLoading] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const adminHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
    setCustomStatus(user?.custom_status || "");
    setOriginalDisplayName(user?.display_name || "");
    setOriginalStatus(user?.custom_status || "");
  }, [user]);

  useEffect(() => {
    calculateStorage();
  }, []);

  useEffect(() => {
    applyTheme(appearancePrefs.theme);
  }, []);

  const hasProfileChanges =
    displayName !== originalDisplayName || customStatus !== originalStatus;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setAvatarLoading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}.${ext}`;

      const { error: removeError } = await supabase.storage
        .from("nexus-files")
        .remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("nexus-files")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("nexus-files")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      updateUser({ ...user, avatar_url: avatarUrl });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error((err as Error).message || "Failed to update avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!hasProfileChanges || !user) return;

    setSaving(true);
    try {
      const updates: Partial<ProfileUser> = {};

      if (displayName.trim() !== originalDisplayName) {
        if (displayName.trim().length < 2) {
          toast.error("Display name must be at least 2 characters");
          setSaving(false);
          return;
        }
        if (!/^[a-zA-Z0-9_\s]+$/.test(displayName.trim())) {
          toast.error("Display name can only contain letters, numbers, spaces, and underscores");
          setSaving(false);
          return;
        }
        updates.display_name = displayName.trim();
      }

      if (customStatus.trim() !== originalStatus) {
        if (customStatus.length > 100) {
          toast.error("Status must be less than 100 characters");
          setSaving(false);
          return;
        }
        updates.custom_status = customStatus.trim();
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      updateUser({ ...user, ...updates });
      setOriginalDisplayName(displayName);
      setOriginalStatus(customStatus);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const updateNotifPref = (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem("nexus_notification_prefs", JSON.stringify(updated));
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!("Notification" in window)) {
        toast.error("Browser notifications not supported");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateNotifPref("push", true);
        toast.success("Push notifications enabled");
      } else {
        toast.error("Notifications blocked by browser. Enable in browser settings.");
      }
    } else {
      updateNotifPref("push", false);
      toast.info("Push notifications disabled");
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    updateNotifPref("sound", enabled);
    if (enabled) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        toast.info("Audio preview not available");
      }
    }
  };

  const handleVibrationToggle = (enabled: boolean) => {
    updateNotifPref("vibration", enabled);
    if (enabled && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const applyTheme = (themeName: string) => {
    const theme = THEMES[themeName as keyof typeof THEMES];
    if (!theme) return;

    document.documentElement.style.setProperty("--bg-primary", theme.bgPrimary);
    document.documentElement.style.setProperty("--bg-secondary", theme.bgSecondary);
    document.documentElement.style.setProperty("--accent-primary", theme.accentPrimary);
    document.documentElement.style.setProperty("--accent-secondary", theme.accentSecondary);

    document.documentElement.style.setProperty(
      "--background",
      themeName === "cyber"
        ? "240 33% 4%"
        : themeName === "midnight"
        ? "214 27% 8%"
        : "261 28% 7%"
    );
    document.documentElement.style.setProperty(
      "--primary",
      themeName === "cyber"
        ? "153 100% 50%"
        : themeName === "midnight"
        ? "212 100% 67%"
        : "263 70% 71%"
    );
  };

  const handleThemeChange = (themeName: string) => {
    applyTheme(themeName);
    const prefs = { ...appearancePrefs, theme: themeName };
    setAppearancePrefs(prefs);
    localStorage.setItem("nexus_appearance_prefs", JSON.stringify(prefs));
    toast.success(`Theme changed to ${THEMES[themeName as keyof typeof THEMES].name}`);
  };

  const handleFontSizeChange = (size: string) => {
    const fontSize = FONT_SIZES[size as keyof typeof FONT_SIZES];
    document.documentElement.style.setProperty("--font-size-base", fontSize);
    const prefs = { ...appearancePrefs, fontSize: size };
    setAppearancePrefs(prefs);
    localStorage.setItem("nexus_appearance_prefs", JSON.stringify(prefs));
  };

  const handleReducedMotionToggle = (enabled: boolean) => {
    document.documentElement.style.setProperty(
      "--transition-speed",
      enabled ? "0s" : "200ms"
    );
    document.body.classList.toggle("reduce-motion", enabled);
    const prefs = { ...appearancePrefs, reducedMotion: enabled };
    setAppearancePrefs(prefs);
    localStorage.setItem("nexus_appearance_prefs", JSON.stringify(prefs));
  };

  const calculateStorage = async () => {
    try {
      const { data, error } = await supabase.storage.from("nexus-files").list("", { limit: 1000 });
      if (error) throw error;

      let totalSize = 0;
      if (data) {
        for (const item of data) {
          if (item.metadata?.size) {
            totalSize += item.metadata.size;
          }
        }
      }
      setStorageUsed(totalSize);
    } catch {
      setStorageUsed(0);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("nexus_")) localStorage.removeItem(key);
      });
      sessionStorage.clear();

      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }

      toast.success("Cache cleared successfully");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Failed to clear some cache data");
    } finally {
      setClearingCache(false);
    }
  };

  const handleExportChats = async () => {
    if (!user) return;

    setExporting(true);
    try {
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      const convIds = memberships?.map((m) => m.conversation_id) || [];

      if (convIds.length === 0) {
        toast.info("No conversations to export");
        setExporting(false);
        return;
      }

      const { data: messages } = await supabase
        .from("messages")
        .select(
          `
          id, content, type, created_at,
          sender:profiles!sender_id(display_name),
          conversation:conversations(name, type)
        `
        )
        .in("conversation_id", convIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      let exportText = `NEXUS Chat Export\n`;
      exportText += `Exported by: ${user.display_name || user.username}\n`;
      exportText += `Date: ${new Date().toLocaleString()}\n`;
      exportText += `Total messages: ${messages?.length || 0}\n`;
      exportText += `================================\n\n`;

      const groupedMessages: Record<string, typeof messages> = {};
      messages?.forEach((msg) => {
        const convName = msg.conversation?.name || "Unknown";
        if (!groupedMessages[convName]) groupedMessages[convName] = [];
        groupedMessages[convName].push(msg);
      });

      Object.entries(groupedMessages).forEach(([convName, msgs]) => {
        const firstMsg = msgs[0];
        const convType = firstMsg.conversation?.type || "direct";
        exportText += `[${convType === "group" ? "Group" : "DM"}: ${convName}]\n`;

        msgs.forEach((msg) => {
          const date = new Date(msg.created_at).toLocaleString();
          const sender = msg.sender?.display_name || "Unknown";
          const content = msg.content || (msg.type === "image" ? "[Image]" : msg.type === "file" ? "[File]" : "[Message]");
          exportText += `[${date}] ${sender}: ${content}\n`;
        });
        exportText += `\n`;
      });

      const blob = new Blob([exportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus_export_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Chat history exported successfully");
    } catch (err) {
      toast.error((err as Error).message || "Failed to export chat history");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (!user) return;

    setDeleteDataLoading(true);
    try {
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      const convIds = memberships?.map((m) => m.conversation_id) || [];

      for (const convId of convIds) {
        await supabase
          .from("messages")
          .update({ is_deleted: true })
          .eq("conversation_id", convId)
          .eq("sender_id", user.id);
      }

      await supabase
        .from("conversation_members")
        .delete()
        .eq("user_id", user.id);

      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      toast.success("Your data has been deleted");
      setShowDeleteData(false);
      setTimeout(() => logout(), 1000);
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete data");
    } finally {
      setDeleteDataLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (err) {
      toast.error((err as Error).message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      if (user) {
        await supabase
          .from("profiles")
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq("id", user.id);
      }

      await supabase.auth.signOut();

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("nexus_")) localStorage.removeItem(key);
      });
      sessionStorage.clear();

      logout();
      navigate("/login");
    } catch {
      await supabase.auth.signOut();
      logout();
      navigate("/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleAdminHeaderTap = () => {
    const now = Date.now();
    if (now - lastTap < 500) {
      setTapCount((prev) => prev + 1);
    } else {
      setTapCount(1);
    }
    setLastTap(now);
  };

  const handleAdminHeaderLongPressStart = useCallback(() => {
    if (tapCount >= 3) {
      longPressTimer.current = setTimeout(() => {
        setShowTerminalButton(true);
        if (navigator.vibrate) navigator.vibrate(100);
        toast.success("Terminal unlocked", { icon: "🔓" });
      }, 2000);
    }
  }, [tapCount]);

  const handleAdminHeaderLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto pb-20">
        <div className="px-4 pt-4 pb-3">
          <h2 className="font-display text-lg font-bold text-foreground">Settings</h2>
        </div>

        <div className="space-y-1">
          <SectionHeader icon={User} label="Profile" />

          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className={`relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full ${
                    avatarLoading ? "opacity-50" : ""
                  }`}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary font-display text-xl font-bold text-primary-foreground">
                      {getInitials(user?.display_name || user?.username || "?")}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  {avatarLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </label>
              </div>
              <div>
                <p className="font-body text-sm text-muted-foreground">
                  Tap to change avatar
                </p>
                <p className="font-body text-xs text-muted-foreground/60 mt-1">
                  JPG, PNG, WebP up to 5MB
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="Your display name"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {displayName.length}/50
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Username
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>@{user?.username}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/60" title="Username cannot be changed. Contact admin.">
                Username cannot be changed
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Custom Status
              </label>
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value.slice(0, 100))}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="What's on your mind?"
              />
              <div className="mt-1 flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {customStatus.length}/100
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/60">
                e.g. "Working on project" or "Available for calls"
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges || saving}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-2.5 font-display text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          <div className="border-t border-border/50" />

          <SectionHeader icon={Bell} label="Notifications" />

          <div className="px-4 py-3 space-y-1">
            <ToggleRow
              label="Push Notifications"
              description="Receive browser push notifications"
              checked={notifPrefs.push}
              onChange={handlePushToggle}
            />
            <ToggleRow
              label="Message Notifications"
              description="Show toasts for new messages"
              checked={notifPrefs.messages}
              onChange={(v) => updateNotifPref("messages", v)}
            />
            <ToggleRow
              label="Job Notifications"
              description="Show toasts for new jobs"
              checked={notifPrefs.jobs}
              onChange={(v) => updateNotifPref("jobs", v)}
            />
            <ToggleRow
              label="Notification Sound"
              description="Play sound on notifications"
              checked={notifPrefs.sound}
              onChange={handleSoundToggle}
            />
            <ToggleRow
              label="Vibration"
              description="Vibrate on notifications (mobile)"
              checked={notifPrefs.vibration}
              onChange={handleVibrationToggle}
            />
          </div>

          <div className="border-t border-border/50" />

          <SectionHeader icon={Palette} label="Appearance" />

          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`relative rounded-lg p-3 transition-all ${
                      appearancePrefs.theme === key
                        ? "ring-2 ring-primary glow"
                        : "border border-border hover:border-primary/30"
                    }`}
                  >
                    <div
                      className="h-8 rounded mb-2"
                      style={{ backgroundColor: theme.bgPrimary }}
                    >
                      <div className="flex">
                        <div
                          className="w-1/2 rounded-l"
                          style={{ backgroundColor: theme.accentPrimary }}
                        />
                        <div
                          className="w-1/2 rounded-r"
                          style={{ backgroundColor: theme.accentSecondary }}
                        />
                      </div>
                    </div>
                    <span className="block text-xs font-medium text-foreground">
                      {theme.name}
                    </span>
                    {appearancePrefs.theme === key && (
                      <div className="absolute right-1 top-1">
                        <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M4.5 8L2 5.5L3 4.5L4.5 6L8.5 2L9.5 3L4.5 8Z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Font Size
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {Object.entries(FONT_SIZES).map(([key, size]) => (
                  <button
                    key={key}
                    onClick={() => handleFontSizeChange(key)}
                    className={`flex-1 py-2 text-xs font-medium transition-all ${
                      appearancePrefs.fontSize === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    } ${key !== "small" ? "border-l border-border" : ""}`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              label="Reduced Animations"
              description="Minimize motion effects"
              checked={appearancePrefs.reducedMotion}
              onChange={handleReducedMotionToggle}
            />
          </div>

          <div className="border-t border-border/50" />

          <SectionHeader icon={HardDrive} label="Storage & Data" />

          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Storage Used</span>
                <span className="text-xs font-mono text-foreground">
                  {formatBytes(storageUsed)} / 50 MB
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${Math.min((storageUsed / (50 * 1024 * 1024)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleExportChats}
              disabled={exporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 font-display text-sm font-medium text-foreground transition-all hover:bg-muted/50 active:scale-[0.98] disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Chat History
                </>
              )}
            </button>

            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 font-display text-sm font-medium text-foreground transition-all hover:bg-muted/50 active:scale-[0.98] disabled:opacity-50"
            >
              {clearingCache ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Clear Cache
                </>
              )}
            </button>

            {user?.role !== "admin" && (
              <button
                onClick={() => setShowDeleteData(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-2.5 font-display text-sm font-medium text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Data
              </button>
            )}
          </div>

          {user?.role === "admin" && (
            <>
              <div className="border-t border-border/50" />

              <div
                className="border-l-4 border-primary pl-0"
                ref={adminHeaderRef}
                onTouchStart={handleAdminHeaderLongPressStart}
                onTouchEnd={handleAdminHeaderLongPressEnd}
                onMouseDown={handleAdminHeaderLongPressStart}
                onMouseUp={handleAdminHeaderLongPressEnd}
                onMouseLeave={handleAdminHeaderLongPressEnd}
              >
                <SectionHeader icon={Shield} label="Admin Panel" />
              </div>

              <div className="px-4 py-2 space-y-1">
                <ActionRow
                  label="Manage Users"
                  onClick={() => setShowUserManagement(true)}
                />
                <ActionRow
                  label="Integrations"
                  onClick={() => setShowIntegrations(true)}
                />
                <ActionRow
                  label="System Logs"
                  onClick={() => setShowSystemLogs(true)}
                />
              </div>

              {showTerminalButton && (
                <div className="px-4 pb-2 animate-slide-up">
                  <button
                    onClick={() => setShowTerminal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 py-2.5 font-display text-sm font-medium text-primary transition-all hover:bg-primary/10 active:scale-[0.98] animate-pulse"
                    style={{ boxShadow: "0 0 20px rgba(0, 255, 136, 0.3)" }}
                  >
                    <Terminal className="h-4 w-4" />
                    Open Terminal
                  </button>
                </div>
              )}
            </>
          )}

          <div className="border-t border-border/50" />

          <SectionHeader icon={Lock} label="Security" />

          <div className="px-4 py-4 space-y-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 font-display text-sm font-medium text-foreground transition-all hover:bg-muted/50 active:scale-[0.98]"
            >
              Change Password
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Current Session</p>
              <p className="text-sm text-foreground">
                Started: {new Date(user?.last_seen || Date.now()).toLocaleDateString()}
              </p>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut({ scope: "others" });
                    toast.success("All other sessions terminated");
                  } catch {
                    toast.error("Failed to sign out other sessions");
                  }
                }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Sign out all other devices
              </button>
            </div>
          </div>

          <div className="border-t border-border/50" />

          <SectionHeader icon={Info} label="About" />

          <div className="px-4 py-4 space-y-3">
            <div className="text-center">
              <h3 className="font-display text-2xl font-bold text-primary glow-text">
                NEXUS
              </h3>
              <p className="font-body text-sm text-muted-foreground">v1.0.0</p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                Private Team Communication Platform
              </p>
            </div>

            <div className="border-t border-border/50 pt-3 space-y-2">
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-all hover:bg-muted/50">
                Report Bug
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-all hover:bg-muted/50">
                Documentation
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-all hover:bg-muted/50">
                Licenses
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-8 pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive py-3 font-display text-sm font-semibold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </div>

      {showUserManagement && (
        <UserManagementModal
          open={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {showIntegrations && (
        <IntegrationCards
          open={showIntegrations}
          onClose={() => setShowIntegrations(false)}
        />
      )}

      {showSystemLogs && (
        <SystemLogs
          open={showSystemLogs}
          onClose={() => setShowSystemLogs(false)}
        />
      )}

      {showTerminal && (
        <AdminTerminal
          open={showTerminal}
          onClose={() => setShowTerminal(false)}
        />
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-display text-lg font-bold text-foreground">
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="Min 8 characters"
                />
                {newPassword && (
                  <div className="mt-1">
                    <div className="h-1 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          newPassword.length < 8
                            ? "bg-destructive w-1/4"
                            : newPassword.length < 12
                            ? "bg-warning w-2/4"
                            : "bg-primary w-full"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {newPassword.length < 8
                        ? "Too short"
                        : newPassword.length < 12
                        ? "Good"
                        : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="Confirm your password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="mt-1 block text-xs text-destructive">Passwords don't match</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border p-4">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg px-4 py-2 font-display text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading || newPassword !== confirmPassword || newPassword.length < 8}
                className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Disconnect from NEXUS?"
        message="You will need to log in again to access your chats."
        confirmText="Disconnect"
        confirmColor="destructive"
        loading={logoutLoading}
      />

      <ConfirmDialog
        open={showDeleteData}
        onClose={() => setShowDeleteData(false)}
        onConfirm={handleDeleteData}
        title="Delete All Your Data"
        message={
          <>
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold">This action cannot be undone!</span>
            </div>
            <p>This will permanently delete all your messages, conversations, and notifications.</p>
          </>
        }
        confirmText="Delete Everything"
        confirmColor="destructive"
        requireText="DELETE"
        loading={deleteDataLoading}
      />
    </>
  );
};

const SectionHeader = ({ icon: Icon, label }: { icon: typeof User; label: string }) => (
  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
    <Icon className="h-4 w-4 text-primary" />
    <span className="font-display text-xs uppercase tracking-wider text-primary">{label}</span>
  </div>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="font-body text-sm text-foreground">{label}</p>
      {description && (
        <p className="font-body text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

const ActionRow = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between py-3 text-left transition-all hover:bg-muted/30 active:scale-[0.99]"
  >
    <span className="font-body text-sm text-foreground">{label}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </button>
);

export default SettingsTab;
