import { mockUsers } from "@/data/mockData";

interface PeopleTabProps {
  onSelectUser: (userId: string) => void;
}

const PeopleTab = ({ onSelectUser }: PeopleTabProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-3">
        <h2 className="font-display text-lg font-bold text-foreground">
          Members <span className="text-muted-foreground font-normal text-sm">({mockUsers.length})</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className="press flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-muted/30"
          >
            <div className="relative flex-shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface font-display text-sm text-primary">
                {user.displayName.charAt(0)}
              </div>
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body text-[15px] font-semibold text-foreground">{user.displayName}</span>
                <span className={`rounded-full px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider ${
                  user.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
                {user.status || (user.isOnline ? "Active now" : `Last seen ${user.lastSeen}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeopleTab;
