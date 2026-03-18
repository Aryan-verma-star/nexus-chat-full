import { mockJobs } from "@/data/mockData";
import { useState } from "react";
import { Clock, DollarSign, Briefcase } from "lucide-react";

const JobsTab = () => {
  const [filter, setFilter] = useState<"all" | "new" | "claimed" | "completed">("all");

  const filtered = mockJobs.filter((j) => filter === "all" || j.status === filter);

  const statusColor = (s: string) => {
    switch (s) {
      case "new": return "bg-warning/20 text-warning";
      case "claimed": return "bg-secondary/20 text-secondary";
      case "completed": return "bg-primary/20 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const platformColor = (p: string) => p === "fiverr" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary";

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Job Board</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "new", "claimed", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`press whitespace-nowrap rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-all duration-200 ${
                filter === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {f} ({mockJobs.filter((j) => f === "all" || j.status === f).length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-20">
        {filtered.map((job) => (
          <div key={job.id} className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className={`rounded-full px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${platformColor(job.platform)}`}>
                {job.platform}
              </span>
              <span className="font-body text-[11px] text-muted-foreground">{job.createdAt}</span>
            </div>
            <h3 className="font-body text-base font-semibold text-foreground mb-1">{job.title}</h3>
            <p className="font-body text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-body text-sm font-semibold text-primary">
                  <DollarSign className="h-3.5 w-3.5" />{job.budget}
                </span>
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{job.deadline}
                </span>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-display text-[10px] uppercase ${statusColor(job.status)}`}>
                {job.status === "claimed" ? `Claimed by ${job.claimedBy}` : job.status}
              </span>
            </div>
            {job.status === "new" && (
              <button className="press mt-3 w-full rounded-xl bg-gradient-sent py-2.5 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:brightness-110">
                Claim Job
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-2xl mb-2">💼</span>
            <p className="font-body text-sm text-muted-foreground">No jobs available right now</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsTab;
