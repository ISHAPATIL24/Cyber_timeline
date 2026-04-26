import { useMemo } from "react";
import { Activity, Globe, Clock, ShieldAlert } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { IncidentSummary as Summary, LogEvent } from "@/lib/logParser";

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) {
  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${accent || "text-primary"}`} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function buildFrequencyData(events: LogEvent[]) {
  const validEvents = events.filter((e) => e.timestamp && !e.timestamp.startsWith("Line"));
  if (validEvents.length === 0) return [];

  const buckets: Record<string, { total: number; critical: number; warning: number }> = {};

  for (const e of validEvents) {
    // Extract minute-level key from timestamp
    const key = e.timestamp.replace(/:\d{2}$/, ""); // drop seconds
    if (!buckets[key]) buckets[key] = { total: 0, critical: 0, warning: 0 };
    buckets[key].total++;
    if (e.severity === "critical" || e.severity === "danger") buckets[key].critical++;
    if (e.severity === "warning") buckets[key].warning++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, counts]) => ({ time, ...counts }));
}

export function IncidentSummary({ summary, events }: { summary: Summary; events: LogEvent[] }) {
  const chartData = useMemo(() => buildFrequencyData(events), [events]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Events" value={summary.totalEvents} />
        <StatCard icon={Globe} label="Unique IPs" value={summary.uniqueIPs} />
        <StatCard icon={ShieldAlert} label="Critical" value={summary.severityCounts.critical || 0} accent="text-destructive" />
        <StatCard icon={Clock} label="Warnings" value={summary.severityCounts.warning || 0} accent="text-warning" />
      </div>

      {/* Event Frequency Chart */}
      {chartData.length > 1 && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Event Frequency Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(217, 33%, 17%)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(217, 33%, 17%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 11%)",
                  border: "1px solid hsl(217, 33%, 17%)",
                  borderRadius: "8px",
                  fontSize: 12,
                  color: "hsl(215, 20%, 65%)",
                }}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(217, 91%, 60%)" fill="url(#gradTotal)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="critical" stroke="hsl(0, 84%, 60%)" fill="url(#gradCritical)" strokeWidth={2} name="Critical/Danger" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Time Range */}
      {summary.timeRange && (
        <div className="glass-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Time Range</h3>
          <p className="font-mono text-sm text-muted-foreground">
            {summary.timeRange.start} → {summary.timeRange.end}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top IPs */}
        {summary.topIPs.length > 0 && (
          <div className="glass-card rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Top Source IPs</h3>
            <div className="space-y-2">
              {summary.topIPs.map(({ ip, count }) => (
                <div key={ip} className="flex justify-between items-center">
                  <span className="font-mono text-sm text-muted-foreground">{ip}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-primary/20 rounded-full w-24 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(count / summary.topIPs[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attack Types */}
        {summary.attackTypes.length > 0 && (
          <div className="glass-card rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Detected Threats</h3>
            <div className="flex flex-wrap gap-2">
              {summary.attackTypes.map((type) => (
                <span key={type} className="text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Severity Bar */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Severity Distribution</h3>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {(["critical", "danger", "warning", "info"] as const).map((sev) => {
            const count = summary.severityCounts[sev] || 0;
            const pct = summary.totalEvents > 0 ? (count / summary.totalEvents) * 100 : 0;
            const colors = {
              critical: "bg-destructive",
              danger: "bg-destructive/70",
              warning: "bg-warning",
              info: "bg-primary",
            };
            return pct > 0 ? (
              <div key={sev} className={`${colors[sev]} rounded-sm`} style={{ width: `${pct}%` }} title={`${sev}: ${count}`} />
            ) : null;
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          {(["critical", "danger", "warning", "info"] as const).map((sev) => (
            <span key={sev} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                sev === "critical" || sev === "danger" ? "bg-destructive" : sev === "warning" ? "bg-warning" : "bg-primary"
              }`} />
              {sev} ({summary.severityCounts[sev] || 0})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
