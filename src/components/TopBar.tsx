import { Bell } from "lucide-react";

interface TopBarProps {
  notificationCount?: number;
}

const TopBar = ({ notificationCount = 0 }: TopBarProps) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-1">
        <span className="font-display text-base font-bold text-primary">NEXUS</span>
        <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
      </div>
      <div className="flex items-center gap-3">
        <button className="press relative p-2">
          <Bell className="h-5 w-5 text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 font-display text-[9px] text-accent-foreground">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-display text-xs text-primary">
          Y
        </div>
      </div>
    </header>
  );
};

export default TopBar;
