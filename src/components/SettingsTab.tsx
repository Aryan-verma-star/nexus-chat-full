import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { themeMeta, applyTheme, getSavedTheme, saveTheme, getThemeHex, type ThemeName } from "@/lib/themes";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 48, height: 28, borderRadius: 14,
      background: checked ? "hsl(var(--primary))" : "hsl(var(--muted))",
      cursor: "pointer", position: "relative", transition: "background 0.2s",
    }}
  >
    <div style={{
      width: 22, height: 22, borderRadius: 11, background: "#fff",
      position: "absolute", top: 3, left: checked ? 23 : 3, transition: "left 0.2s",
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    }} />
  </div>
);

export default function SettingsTab() {
  const auth = useAuth();
  const user = auth?.user as any;
  const logout = auth?.logout || (auth as any)?.signOut;
  const updateUser = auth?.updateUser;

  const [displayName, setDisplayName] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem("nexus_notification_prefs");
      return stored ? JSON.parse(stored) : { push: false, messages: true, jobs: true, sound: true, vibration: false };
    } catch { return { push: false, messages: true, jobs: true, sound: true, vibration: false }; }
  });

  const [activeTheme, setActiveTheme] = useState<ThemeName>(getSavedTheme());
  const themeColors = getThemeHex(activeTheme);
  const [fontSize, setFontSize] = useState(() => {
    try {
      const stored = localStorage.getItem("nexus_appearance_prefs");
      return stored ? JSON.parse(stored).fontSize || "medium" : "medium";
    } catch { return "medium"; }
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [showTerminalBtn, setShowTerminalBtn] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: string; text: string }>>([]);
  const [secretKey, setSecretKey] = useState("");
  const [askingKey, setAskingKey] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const termInputRef = useRef<HTMLInputElement>(null);
  const termOutputRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setCustomStatus(user.custom_status || "");
      setOriginalDisplayName(user.display_name || "");
      setOriginalStatus(user.custom_status || "");
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "hsl(var(--muted-foreground))", fontFamily: "Inter, sans-serif" }}>
        Loading settings...
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const hasProfileChanges = displayName !== originalDisplayName || customStatus !== originalStatus;

  const handleThemeChange = (name: ThemeName) => {
    console.log('[NEXUS SETTINGS] Theme change clicked:', name);
    applyTheme(name);
    saveTheme(name);
    setActiveTheme(name);
    console.log('[NEXUS SETTINGS] Theme applied, state updated');
  };

  const applyFontSize = (size: string) => {
    const map: Record<string, string> = { small: "13px", medium: "14px", large: "16px" };
    document.documentElement.style.setProperty("--font-size-base", map[size] || "14px");
    setFontSize(size);
    try {
      const prefs = JSON.parse(localStorage.getItem("nexus_appearance_prefs") || "{}");
      prefs.fontSize = size;
      localStorage.setItem("nexus_appearance_prefs", JSON.stringify(prefs));
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!hasProfileChanges) return;
    setSaving(true);
    try {
      const updates: any = {};
      if (displayName.trim() !== originalDisplayName) updates.display_name = displayName.trim();
      if (customStatus.trim() !== originalStatus) updates.custom_status = customStatus.trim();
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
      if (updateUser) updateUser({ ...user, ...updates });
      setOriginalDisplayName(displayName.trim());
      setOriginalStatus(customStatus.trim());
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save profile", "error");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB", "error"); return; }
    setAvatarLoading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `avatars/${user.id}.${ext}`;
      await supabase.storage.from("nexus-files").remove([path]);
      const { error: upErr } = await supabase.storage.from("nexus-files").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("nexus-files").getPublicUrl(path);
      const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
      if (dbErr) throw dbErr;
      if (updateUser) updateUser({ ...user, avatar_url: avatarUrl });
      showToast("Avatar updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload avatar", "error");
    } finally { setAvatarLoading(false); }
  };

  const updateNotifPref = (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    localStorage.setItem("nexus_notification_prefs", JSON.stringify(updated));
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { showToast("Notifications blocked by browser", "error"); return; }
    }
    updateNotifPref("push", enabled);
    showToast(enabled ? "Push notifications enabled" : "Push notifications disabled", "success");
  };

  const handleLogout = async () => {
    try {
      await supabase.from("profiles").update({ is_online: false, last_seen: new Date().toISOString() }).eq("id", user.id);
      await supabase.auth.signOut();
      Object.keys(localStorage).forEach(k => { if (k.startsWith("nexus_")) localStorage.removeItem(k); });
      sessionStorage.clear();
      if (logout) logout();
    } catch {
      await supabase.auth.signOut();
      if (logout) logout();
    }
  };

  const handleAdminTap = () => {
    const now = Date.now();
    const newCount = (now - lastTap < 500) ? tapCount + 1 : 1;
    setTapCount(newCount);
    setLastTap(now);
  };

  const handleLongPressStart = () => {
    if (tapCount >= 3) {
      longPressRef.current = setTimeout(() => {
        setShowTerminalBtn(true);
        if (navigator.vibrate) navigator.vibrate(100);
        showToast("Terminal unlocked", "success");
      }, 2000);
    }
  };

  const handleLongPressEnd = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const openTerminal = () => {
    const stored = sessionStorage.getItem("nexus_secret_key");
    if (stored) { setSecretKey(stored); setTerminalOpen(true); }
    else { setAskingKey(true); }
  };

  const submitSecretKey = () => {
    if (secretKey.trim()) {
      sessionStorage.setItem("nexus_secret_key", secretKey.trim());
      setAskingKey(false);
      setTerminalOpen(true);
    }
  };

  const executeTerminalCmd = async (cmd: string) => {
    if (cmd) setTerminalHistory(prev => [...prev, { type: "input", text: `> ${cmd}` }]);
    if (cmd) setCommandHistory(prev => [cmd, ...prev]);
    try {
      const API = import.meta.env.VITE_API_URL || "https://Nexus-chat-app-nexus-chat.hf.space";
      const res = await fetch(`${API}/api/secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Secret-Key": secretKey },
        body: JSON.stringify({ command: cmd.split(" ")[0] || null, args: cmd.split(" ").slice(1) }),
      });
      const data = await res.json();
      setTerminalHistory(prev => [...prev, { type: "output", text: data.data?.output || data.error || "No response" }]);
    } catch (err: any) {
      setTerminalHistory(prev => [...prev, { type: "output", text: `Error: ${err.message}` }]);
    }
    setTimeout(() => termOutputRef.current?.scrollTo(0, termOutputRef.current.scrollHeight), 50);
  };

  const handleTerminalKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = (e.target as HTMLInputElement).value.trim();
      if (v === "clear") setTerminalHistory([]);
      else if (v === "exit") setTerminalOpen(false);
      else if (v) executeTerminalCmd(v);
      (e.target as HTMLInputElement).value = "";
      setHistoryIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < commandHistory.length - 1) {
        const i = historyIdx + 1; setHistoryIdx(i);
        (e.target as HTMLInputElement).value = commandHistory[i];
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) { const i = historyIdx - 1; setHistoryIdx(i); (e.target as HTMLInputElement).value = commandHistory[i]; }
      else { setHistoryIdx(-1); (e.target as HTMLInputElement).value = ""; }
    } else if (e.key === "Escape") { setTerminalOpen(false); }
  };

  const getInitials = (name: string) => name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const colors = getThemeHex(activeTheme);
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 99999;
      padding: 12px 24px; border-radius: 12px; font-size: 14px; font-family: Inter, sans-serif;
      background: ${colors.background};
      color: ${type === "error" ? "#ff6688" : type === "success" ? colors.accent : colors.foreground};
      border: 1px solid ${type === "error" ? "#ff336633" : type === "success" ? colors.accent + "33" : "#ffffff11"};
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const sectionStyle: React.CSSProperties = { marginBottom: 32, padding: "0 16px" };
  const headerStyle: React.CSSProperties = {
    fontSize: 16, fontWeight: 700, color: themeColors.fg,
    marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontFamily: "JetBrains Mono, monospace"
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12, color: themeColors.fg,
    fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif",
    boxSizing: "border-box" as const
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--ring)))",
    color: "hsl(var(--primary-foreground))",
    border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, textTransform: "uppercase" as const
  };
  const btnOutline: React.CSSProperties = {
    width: "100%", padding: "14px", background: "transparent",
    border: "1px solid hsl(var(--border))", borderRadius: 12,
    color: themeColors.accent, fontSize: 14, fontWeight: 600, cursor: "pointer"
  };
  const toggleRow: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0", borderBottom: "1px solid hsl(var(--border))"
  };
  const divider: React.CSSProperties = { height: 1, background: "hsl(var(--border))", margin: "24px 0" };
  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
    backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 9998, padding: 16
  };
  const modalBox: React.CSSProperties = {
    background: "hsl(var(--card))", borderRadius: 16, padding: 24,
    maxWidth: 400, width: "100%", border: "1px solid hsl(var(--border))"
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingTop: 16, paddingBottom: 100, fontFamily: "Inter, sans-serif" }}>

      {/* PROFILE */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Profile</div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <label style={{ cursor: "pointer", position: "relative" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 40,
              background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--ring)))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 700, color: "hsl(var(--primary-foreground))",
              border: "2px solid hsl(var(--border))",
              fontFamily: "JetBrains Mono, monospace",
            }}>
              {!user.avatar_url && getInitials(user.display_name || user.username || "?")}
              {avatarLoading && (
                <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: themeColors.accent }}>
                  ...
                </div>
              )}
            </div>
            <div style={{
              position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12,
              background: themeColors.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
            }}>
              📷
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: themeColors.muted, marginBottom: 4, display: "block" }}>Display Name</label>
          <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value.slice(0, 50))} placeholder="Your display name" />
          <div style={{ fontSize: 11, color: themeColors.muted, textAlign: "right", marginTop: 2 }}>{displayName.length}/50</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: themeColors.muted, marginBottom: 4, display: "block" }}>Username 🔒</label>
          <input style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} value={user.username || ""} readOnly />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: themeColors.muted, marginBottom: 4, display: "block" }}>Status</label>
          <input style={inputStyle} value={customStatus} onChange={e => setCustomStatus(e.target.value.slice(0, 100))} placeholder="What's on your mind?" />
          <div style={{ fontSize: 11, color: themeColors.muted, textAlign: "right", marginTop: 2 }}>{customStatus.length}/100</div>
        </div>

        <button
          style={{ ...btnPrimary, opacity: hasProfileChanges && !saving ? 1 : 0.4, pointerEvents: hasProfileChanges && !saving ? "auto" : "none" }}
          onClick={handleSaveProfile}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={divider} />

      {/* NOTIFICATIONS */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Notifications</div>
        <div style={toggleRow}><span style={{ color: themeColors.fg }}>Push Notifications</span><Toggle checked={notifPrefs.push} onChange={handlePushToggle} /></div>
        <div style={toggleRow}><span style={{ color: themeColors.fg }}>Message Notifications</span><Toggle checked={notifPrefs.messages} onChange={v => updateNotifPref("messages", v)} /></div>
        <div style={toggleRow}><span style={{ color: themeColors.fg }}>Job Notifications</span><Toggle checked={notifPrefs.jobs} onChange={v => updateNotifPref("jobs", v)} /></div>
        <div style={toggleRow}><span style={{ color: themeColors.fg }}>Sound</span><Toggle checked={notifPrefs.sound} onChange={v => { updateNotifPref("sound", v); if (v) { try { const c = new AudioContext(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 800; g.gain.value = 0.1; o.start(); o.stop(c.currentTime + 0.15); } catch {} } }} /></div>
        <div style={toggleRow}><span style={{ color: themeColors.fg }}>Vibration</span><Toggle checked={notifPrefs.vibration} onChange={v => { updateNotifPref("vibration", v); if (v && navigator.vibrate) navigator.vibrate(200); }} /></div>
      </div>

      <div style={divider} />

      {/* APPEARANCE */}
      <div style={sectionStyle}>
        <div style={headerStyle}>Appearance</div>

        <label style={{ fontSize: 12, color: themeColors.muted, marginBottom: 8, display: "block" }}>Theme</label>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {Object.values(themeMeta).map((theme) => {
            const isActive = activeTheme === theme.name;
            return (
              <div
                key={theme.name}
                onClick={() => handleThemeChange(theme.name)}
                style={{
                  flex: 1,
                  height: 64,
                  borderRadius: 12,
                  background: theme.previewBg,
                  border: `2px solid ${isActive ? theme.previewAccent : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: isActive ? `0 0 16px ${theme.previewAccent}33` : 'none',
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: theme.previewAccent,
                }} />
                <span style={{
                  fontSize: 11,
                  color: isActive ? theme.previewAccent : '#999',
                  textTransform: 'capitalize' as const,
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {theme.label}
                </span>
                {isActive && (
                  <span style={{ fontSize: 9, color: theme.previewAccent }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        <label style={{ fontSize: 12, color: themeColors.muted, marginBottom: 8, display: "block" }}>Font Size</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["small", "medium", "large"] as const).map(size => (
            <button key={size} onClick={() => applyFontSize(size)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: `1px solid ${fontSize === size ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
              background: fontSize === size ? "hsl(var(--primary) / 0.1)" : "transparent",
              color: fontSize === size ? "hsl(var(--primary))" : themeColors.muted,
              cursor: "pointer", fontSize: 12, textTransform: "capitalize",
            }}>{size}</button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <>
          <div style={divider} />
          <div style={{ ...sectionStyle, borderLeft: `3px solid ${themeColors.accent}`, paddingLeft: 20 }}>
            <div
              style={headerStyle}
              onClick={handleAdminTap}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
            >
              Admin Panel
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={btnOutline} onClick={() => showToast("User management coming soon", "info")}>Manage Users →</button>
              <button style={btnOutline} onClick={() => showToast("Integrations coming soon", "info")}>Integrations →</button>
              <button style={btnOutline} onClick={() => showToast("Logs coming soon", "info")}>View Logs →</button>
              {showTerminalBtn && (
                <button
                  style={{ ...btnOutline, borderColor: themeColors.accent, animation: "pulse 2s infinite" }}
                  onClick={openTerminal}
                >
                  Open Terminal
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div style={divider} />

      {/* ABOUT */}
      <div style={sectionStyle}>
        <div style={headerStyle}>About</div>
        <div style={{ color: themeColors.accent, fontSize: 18, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>NEXUS</div>
        <div style={{ color: themeColors.muted, fontSize: 12, marginTop: 4 }}>v1.0.0</div>
        <div style={{ color: themeColors.muted, fontSize: 12, marginTop: 2 }}>Private Team Communication Platform</div>
        <div style={{ color: themeColors.muted, fontSize: 12, marginTop: 8 }}>Built with care by the team</div>
      </div>

      <div style={divider} />

      {/* LOGOUT */}
      <div style={{ ...sectionStyle, marginBottom: 40 }}>
        <button onClick={() => setShowLogoutConfirm(true)} style={{ ...btnOutline, borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }}>
          🚪 Disconnect
        </button>
      </div>

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div style={modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: themeColors.fg, marginTop: 0 }}>Disconnect from NEXUS?</h3>
            <p style={{ color: themeColors.muted, fontSize: 14 }}>You will need to log in again to access your chats.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button style={{ ...btnOutline, flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button style={{ ...btnOutline, flex: 1, borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))" }} onClick={handleLogout}>Disconnect</button>
            </div>
          </div>
        </div>
      )}

      {/* SECRET KEY PROMPT */}
      {askingKey && (
        <div style={modalOverlay} onClick={() => setAskingKey(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: themeColors.accent, marginTop: 0, fontFamily: "monospace" }}>Enter Secret Key</h3>
            <input
              style={{ ...inputStyle, marginBottom: 16, fontFamily: "monospace" }}
              type="password"
              placeholder="nx_secret_..."
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitSecretKey()}
              autoFocus
            />
            <button style={btnPrimary} onClick={submitSecretKey}>Access Terminal</button>
          </div>
        </div>
      )}

      {/* TERMINAL */}
      {terminalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: "JetBrains Mono, Courier New, monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ color: "#00ff88", fontSize: 12 }}>NEXUS TERMINAL</span>
            <button onClick={() => setTerminalOpen(false)} style={{ background: "none", border: "none", color: "#ff3366", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
          <div ref={termOutputRef} style={{ flex: 1, overflowY: "auto", padding: 16, fontSize: 13, lineHeight: 1.6 }}>
            {terminalHistory.map((h, i) => (
              <div key={i} style={{ color: h.type === "input" ? "#0ea5e9" : "#00ff88", whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const, marginBottom: 4 }}>{h.text}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderTop: "1px solid #1a1a1a" }}>
            <span style={{ color: "#00ff88", marginRight: 8 }}>&gt;</span>
            <input
              ref={termInputRef}
              onKeyDown={handleTerminalKey}
              autoFocus
              style={{ flex: 1, background: "none", border: "none", color: "#00ff88", fontSize: 14, outline: "none", fontFamily: "inherit", caretColor: "#00ff88" }}
              placeholder="Type a command..."
            />
          </div>
        </div>
      )}

      <style>{"@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }"}</style>
    </div>
  );
}
