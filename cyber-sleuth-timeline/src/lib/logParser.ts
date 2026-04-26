export interface LogEvent {
  id: string;
  timestamp: string;
  ip: string;
  eventType: string;
  severity: "info" | "warning" | "danger" | "critical";
  rawLine: string;
}

export interface IncidentSummary {
  totalEvents: number;
  uniqueIPs: number;
  timeRange: { start: string; end: string } | null;
  severityCounts: Record<string, number>;
  topIPs: { ip: string; count: number }[];
  attackTypes: string[];
}

// 🔥 NEW: Action-based classification (important for your logs)
function extractAction(line: string): string {
  const match = line.match(/ACTION:([A-Z_]+)/);
  return match ? match[1] : "";
}

// 🔥 UPDATED EVENT CLASSIFICATION
function classifyEvent(line: string): string {
  const action = extractAction(line);

  if (action === "LOGIN_FAILED") return "Brute Force Attempt";
  if (action === "LOGIN_SUCCESS") return "Successful Login";
  if (action === "PORT_SCAN") return "Reconnaissance Activity";
  if (action === "FILE_ACCESS") return "Sensitive File Access";
  if (action === "BLOCKED") return "Blocked Suspicious Activity";

  // fallback (old logic)
  const lower = line.toLowerCase();

  if (lower.includes("failed")) return "Failed Login";
  if (lower.includes("error")) return "Error";
  if (lower.includes("warning")) return "Warning";

  return "General Log Entry";
}

// 🔥 UPDATED SEVERITY
function classifySeverity(line: string): LogEvent["severity"] {
  const action = extractAction(line);

  if (action === "LOGIN_FAILED") return "danger";
  if (action === "PORT_SCAN") return "warning";
  if (action === "FILE_ACCESS") return "critical";
  if (action === "BLOCKED") return "warning";
  if (action === "LOGIN_SUCCESS") return "info";

  return "info";
}

// TIMESTAMP
const TIMESTAMP_PATTERN = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/;

// IP
const IP_PATTERN = /IP:(\d{1,3}(?:\.\d{1,3}){3})/;

function extractTimestamp(line: string): string {
  const match = line.match(TIMESTAMP_PATTERN);
  return match ? match[1] : "";
}

function extractIP(line: string): string {
  const match = line.match(IP_PATTERN);
  return match ? match[1] : "N/A";
}

// 🔥 MAIN PARSER
export function parseLogs(raw: string): LogEvent[] {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);

  return lines.map((line, i) => {
    const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const ipMatch = line.match(/IP:(\d+\.\d+\.\d+\.\d+)/);
    const actionMatch = line.match(/ACTION:([A-Z_]+)/);

    const action = actionMatch ? actionMatch[1] : "UNKNOWN";

    let eventType = "General Log Entry";
    let severity: LogEvent["severity"] = "info";

    if (action === "LOGIN_FAILED") {
  eventType = "Brute Force Attempt";   // 🔥 changed
  severity = "danger";
}

else if (action === "PORT_SCAN") {
  eventType = "Reconnaissance (Port Scan)";  // 🔥 changed
  severity = "warning";
}

else if (action === "FILE_ACCESS") {
  eventType = "Sensitive File Access";
  severity = "critical";
}

else if (action === "BLOCKED") {
  eventType = "Blocked Suspicious Activity";
  severity = "warning";
}

else if (action === "LOGIN_SUCCESS") {
  eventType = "Successful Login";
  severity = "info";
}

    return {
      id: `event-${i}`,
      timestamp: timestampMatch ? timestampMatch[1] : `Line ${i + 1}`,
      ip: ipMatch ? ipMatch[1] : "N/A",
      eventType,
      severity,
      rawLine: line.trim(),
    };
  });
}

// 🔥 SUMMARY (unchanged, works perfectly)
export function generateSummary(events: LogEvent[]): IncidentSummary {
  const ipCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = { info: 0, warning: 0, danger: 0, critical: 0 };
  const attackTypes = new Set<string>();

  for (const e of events) {
    if (e.ip !== "N/A") ipCounts[e.ip] = (ipCounts[e.ip] || 0) + 1;
    severityCounts[e.severity]++;
    if (e.severity === "danger" || e.severity === "critical") attackTypes.add(e.eventType);
  }

  const topIPs = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  const timestamps = events.map((e) => e.timestamp).filter((t) => t && !t.startsWith("Line"));

  return {
    totalEvents: events.length,
    uniqueIPs: Object.keys(ipCounts).length,
    timeRange: timestamps.length >= 2 ? { start: timestamps[0], end: timestamps[timestamps.length - 1] } : null,
    severityCounts,
    topIPs,
    attackTypes: Array.from(attackTypes),
  };
}