import { MessageSquare, Briefcase, Users, Settings } from "lucide-react";

type Tab = "chats" | "jobs" | "people" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unreadChats?: number;
  newJobs?: number;
}

const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "people", label: "People", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange, unreadChats = 0, newJobs = 0 }: BottomNavProps) => {
  const getBadge = (id: Tab) => {
    if (id === "chats" && unreadChats > 0) return unreadChats;
    if (id === "jobs" && newJobs > 0) return newJobs;
    return 0;
  };

  return (
    <nav className="flex items-center justify-around bg-card border-t border-border" style={{ height: 64 }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = getBadge(tab.id);
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-90"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
            <div className="relative">
              <tab.icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 font-display text-[9px] text-accent-foreground">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className={`font-body text-[10px] transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
export type { Tab };
