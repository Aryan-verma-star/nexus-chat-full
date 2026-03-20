import { useEffect, useState } from "react";
import { X, RefreshCw, Trash2, Loader2, LogIn, MessageSquare, Briefcase, Shield, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";

interface SystemLogsProps {
  open: boolean;
  onClose: () => void;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const getLogIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("login") || actionLower.includes("sign")) {
    return <LogIn className="h-4 w-4 text-primary" />;
  }
  if (actionLower.includes("message") || actionLower.includes("chat")) {
    return <MessageSquare className="h-4 w-4 text-secondary" />;
  }
  if (actionLower.includes("job") || actionLower.includes("fiverr") || actionLower.includes("upwork")) {
    return <Briefcase className="h-4 w-4 text-warning" />;
  }
  if (actionLower.includes("admin") || actionLower.includes("user")) {
    return <Shield className="h-4 w-4 text-destructive" />;
  }
  return <UserPlus className="h-4 w-4 text-muted-foreground" />;
};

const getLogColor = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes("login") || actionLower.includes("sign")) {
    return "bg-primary";
  }
  if (actionLower.includes("message") || actionLower.includes("chat")) {
    return "bg-secondary";
  }
  if (actionLower.includes("job") || actionLower.includes("fiverr") || actionLower.includes("upwork")) {
    return "bg-warning";
  }
  if (actionLower.includes("admin") || actionLower.includes("user")) {
    return "bg-destructive";
  }
  return "bg-muted-foreground";
};

export function SystemLogs({ open, onClose }: SystemLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          user:profiles(display_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const { error } = await supabase.from("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("Activity logs cleared");
      setLogs([]);
      setConfirmClear(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            System Logs
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setConfirmClear(true)}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Clear Logs
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <svg
                className="h-12 w-12 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm">No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="relative mt-0.5">
                    <span className={`block h-2.5 w-2.5 rounded-full ${getLogColor(log.action)}`} />
                    <span className="absolute -left-3 top-1/2 h-px w-3 -translate-y-1/2 bg-border" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLogIcon(log.action)}
                      <span className="font-medium text-sm text-foreground">
                        {log.action}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mb-1">{log.details}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {log.user && (
                        <span className="flex items-center gap-1">
                          {log.user.avatar_url ? (
                            <img
                              src={log.user.avatar_url}
                              alt=""
                              className="h-4 w-4 rounded-full"
                            />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                              {getInitials(log.user.display_name || "?")}
                            </div>
                          )}
                          {log.user.display_name}
                        </span>
                      )}
                      <span>{formatTime(log.created_at)}</span>
                      {log.ip_address && (
                        <span className="font-mono">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-muted px-4 py-2 font-display text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearLogs}
        title="Clear All Logs"
        message="Are you sure you want to delete all activity logs? This action cannot be undone."
        confirmText="Clear All"
        confirmColor="destructive"
        loading={clearing}
      />
    </div>
  );
}
