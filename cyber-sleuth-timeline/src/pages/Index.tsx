import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Download, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogInput } from "@/components/LogInput";
import { Timeline } from "@/components/Timeline";
import { IncidentSummary } from "@/components/IncidentSummary";import { parseLogs, generateSummary, type LogEvent, type IncidentSummary as Summary } from "@/lib/logParser";
import { exportPDF, exportJSON } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logo from "@/assets/cyber_detective.png";
export default function Index() {
  const [events, setEvents] = useState<LogEvent[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "summary">("timeline");

// const handleAnalyze = async (raw: string) => {
//   try {
//     await fetch("http://127.0.0.1:5000/process");

//     const res = await fetch("http://127.0.0.1:5000/timeline");
//     const data = await res.json();

   
    
//     setSummary(null); // ✅ fix
//     setActiveTab("timeline");

//   } catch (err) {
//     console.error(err);
//   }
// };
const handleAnalyze = (raw: string) => {
  const parsed = parseLogs(raw);
  setEvents(parsed);
  setSummary(generateSummary(parsed));
  setActiveTab("timeline");
};


  const handleReset = () => {
    setEvents(null);
    setSummary(null);
  };

  return (
    <div className="min-h-screen cyber-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Cyber Detective Timeline" className="h-8" />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">Cyber Detective</h1>
              <p className="text-xs text-primary font-medium">Timeline</p>
            </div>
          </div>
          {events && summary && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 border-primary/20 text-primary hover:bg-primary/10">
                    <Download className="h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportPDF(events, summary)} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" /> Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportJSON(events, summary)} className="gap-2 cursor-pointer">
                    <FileJson className="h-4 w-4" /> Download JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground gap-1">
                <ArrowLeft className="h-4 w-4" /> New Analysis
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        {!events ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Eye className="h-4 w-4" /> Security Log Analyzer
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Analyze Security Logs</h2>
              <p className="text-muted-foreground">Upload or paste your logs to generate an attack timeline and incident summary.</p>
            </div>
            <LogInput onSubmit={handleAnalyze} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab toggle */}
            <div className="flex gap-1 bg-card/40 rounded-lg p-1 w-fit">
              {(["timeline", "summary"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "timeline" ? `Timeline (${events.length})` : "Incident Summary"}
                </button>
              ))}
            </div>

            {activeTab === "timeline" ? (
              <Timeline events={events} />
            ) : (
              summary && <IncidentSummary summary={summary} events={events} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
