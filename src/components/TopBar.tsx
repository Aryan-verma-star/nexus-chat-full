import { Bell, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Conversation } from "@/lib/chat";

interface TopBarProps {
  notificationCount?: number;
  user?: {
    display_name: string;
    avatar_url?: string | null;
  } | null;
  activeConversation?: Conversation | null;
  onBack?: () => void;
}

const TopBar = ({ notificationCount = 0, user, activeConversation, onBack }: TopBarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = user?.display_name || user?.username || "U";
  const initial = displayName.charAt(0).toUpperCase();

  const getConvName = () => {
    if (!activeConversation) return null;
    if (activeConversation.type === "group") {
      return activeConversation.name || "Group";
    }
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    return other?.profile?.display_name || other?.profile?.username || null;
  };

  const getConvAvatarUrl = () => {
    if (!activeConversation) return null;
    if (activeConversation.type === "group") return null;
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    return other?.profile?.avatar_url || null;
  };

  const getConvSubtitle = () => {
    if (!activeConversation) return null;
    if (activeConversation.type === "group") {
      const count = activeConversation.members?.length || 0;
      return `${count} member${count !== 1 ? "s" : ""}`;
    }
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    if (other?.profile?.is_online) return "online";
    return null;
  };

  const convName = getConvName();
  const convAvatarUrl = getConvAvatarUrl();
  const convSubtitle = getConvSubtitle();
  const isChat = !!activeConversation;

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 bg-card border-b border-border safe-top"
      style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
    >
      {/* Inner flex container — centered content with breathing room */}
      <div className="flex items-center justify-between" style={{ height: 56 }}>
        {/* Left section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isChat && onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors active:scale-90 md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {isChat ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 min-w-0 md:hidden"
            >
              <div className="flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden"
                  style={{ lineHeight: 1 }}
                >
                  {convAvatarUrl ? (
                    <img src={convAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span
                      className="text-foreground font-bold text-sm"
                      style={{ lineHeight: 1 }}
                    >
                      {(convName || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-foreground font-semibold text-[15px] truncate max-w-[150px] leading-tight">
                  {convName}
                </p>
                {convSubtitle && (
                  <p className="text-muted-foreground text-[11px] leading-tight">{convSubtitle}</p>
                )}
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5" style={{ lineHeight: 1 }}>
              <span
                className="font-display text-[17px] font-bold text-primary tracking-[0.15em] leading-none"
                style={{ lineHeight: 1 }}
              >
                NEXUS
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot flex-shrink-0"
                style={{ marginTop: 2 }}
              />
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isChat && (
            <button className="relative p-2 -mr-2 transition-transform active:scale-95">
              <Bell className="h-5 w-5 text-foreground" />
              {notificationCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 font-display text-[9px] text-accent-foreground">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <div
            className="rounded-full bg-muted flex items-center justify-center text-primary font-display text-xs flex-shrink-0 ml-1"
            style={{ width: 36, height: 36, lineHeight: 1, fontSize: 13 }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="rounded-full object-cover"
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <span style={{ lineHeight: 1 }}>{initial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
