import { Shield, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import type { LogEvent } from "@/lib/logParser";

const SEVERITY_CONFIG = {
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "Warning" },
  danger: { icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Danger" },
  critical: { icon: Shield, color: "text-destructive", bg: "bg-destructive/20", border: "border-destructive/50", label: "Critical" },
};

export function Timeline({ events }: { events: LogEvent[] }) {
  return (
    <div className="relative animate-fade-in">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 timeline-line opacity-40" />

      <div className="space-y-4">
        {events.map((event, i) => {
          const config = SEVERITY_CONFIG[event.severity];
          const Icon = config.icon;

          return (
            <div
              key={event.id}
              className="relative pl-14 animate-slide-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Dot */}
              <div className={`absolute left-[18px] top-4 w-3 h-3 rounded-full ${config.bg} ${config.border} border-2 z-10`} />

              <div className="glass-card rounded-lg p-4 hover:glow-border transition-all group">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="font-medium text-foreground text-sm">{event.eventType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{event.timestamp}</span>
                    {event.ip !== "N/A" && (
                      <span className="bg-secondary px-2 py-0.5 rounded">{event.ip}</span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs font-mono text-muted-foreground/70 truncate group-hover:whitespace-normal group-hover:break-all transition-all">
                  {event.rawLine}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
