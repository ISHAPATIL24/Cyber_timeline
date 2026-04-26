import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LogEvent, IncidentSummary } from "./logParser";

export function exportJSON(events: LogEvent[], summary: IncidentSummary) {
  const data = {
    exportedAt: new Date().toISOString(),
    summary,
    timeline: events.map(({ id, ...rest }) => rest),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `cyber-detective-report-${dateStamp()}.json`);
}

export function exportPDF(events: LogEvent[], summary: IncidentSummary) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text("Cyber Detective Timeline", 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Incident Summary", 14, 44);

  const summaryData = [
    ["Total Events", String(summary.totalEvents)],
    ["Unique IPs", String(summary.uniqueIPs)],
    ["Critical Events", String(summary.severityCounts.critical || 0)],
    ["Danger Events", String(summary.severityCounts.danger || 0)],
    ["Warnings", String(summary.severityCounts.warning || 0)],
    ["Info Events", String(summary.severityCounts.info || 0)],
  ];

  if (summary.timeRange) {
    summaryData.push(["Time Range", `${summary.timeRange.start} → ${summary.timeRange.end}`]);
  }
  if (summary.attackTypes.length > 0) {
    summaryData.push(["Detected Threats", summary.attackTypes.join(", ")]);
  }
  if (summary.topIPs.length > 0) {
    summaryData.push(["Top Source IPs", summary.topIPs.map((t) => `${t.ip} (${t.count})`).join(", ")]);
  }

  autoTable(doc, {
    startY: 48,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Timeline table
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Event Timeline", 14, finalY + 14);

  const severityColors: Record<string, [number, number, number]> = {
    critical: [239, 68, 68],
    danger: [239, 68, 68],
    warning: [250, 204, 21],
    info: [59, 130, 246],
  };

  autoTable(doc, {
    startY: finalY + 18,
    head: [["#", "Timestamp", "IP", "Event Type", "Severity", "Raw Log"]],
    body: events.map((e, i) => [
      String(i + 1),
      e.timestamp,
      e.ip,
      e.eventType,
      e.severity.toUpperCase(),
      e.rawLine.length > 80 ? e.rawLine.substring(0, 77) + "..." : e.rawLine,
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8 },
      5: { cellWidth: 60 },
    },
    margin: { left: 14, right: 14 },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 4) {
        const sev = String(data.cell.raw).toLowerCase();
        const color = severityColors[sev];
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Cyber Detective Timeline — Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`cyber-detective-report-${dateStamp()}.pdf`);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
