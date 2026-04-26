import { useState, useCallback } from "react";
import { Upload, FileText, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogInputProps {
  onSubmit: (logs: string) => void;
}

const SAMPLE_LOGS = `2024-03-15 08:23:14 192.168.1.105 sshd: Failed password for root from 10.0.0.45
2024-03-15 08:23:16 192.168.1.105 sshd: Failed password for root from 10.0.0.45
2024-03-15 08:23:18 192.168.1.105 sshd: Failed password for admin from 10.0.0.45
2024-03-15 08:24:01 192.168.1.105 sshd: Failed password for root from 10.0.0.45
2024-03-15 08:24:03 192.168.1.105 Warning: Possible brute force attack detected from 10.0.0.45
2024-03-15 08:25:30 192.168.1.200 firewall: Denied connection from 203.0.113.50 to port 3306
2024-03-15 08:26:45 192.168.1.200 firewall: Denied connection from 203.0.113.50 to port 22
2024-03-15 08:27:10 192.168.1.200 Warning: Port scan detected from 203.0.113.50
2024-03-15 08:30:00 192.168.1.50 apache: SQL injection attempt from 198.51.100.23 - GET /login?id=1' OR '1'='1
2024-03-15 08:31:22 192.168.1.50 apache: XSS attack detected from 198.51.100.23 - GET /search?q=<script>alert(1)</script>
2024-03-15 08:35:00 192.168.1.10 sshd: Accepted password for admin from 192.168.1.1
2024-03-15 08:40:15 192.168.1.10 Error: Unauthorized access to /etc/shadow detected
2024-03-15 08:42:00 192.168.1.10 Warning: Suspicious file modification in /var/www/html
2024-03-15 08:45:00 192.168.1.10 Malware signature detected in uploaded file payload.exe`;

export function LogInput({ onSubmit }: LogInputProps) {
  const [logText, setLogText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10 MB.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setLogText(e.target?.result as string);
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`glass-card rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragActive ? "glow-border scale-[1.01]" : "border-border"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".log,.txt,.csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className="mx-auto h-10 w-10 text-primary mb-3" />
        <p className="text-foreground font-medium">
          {fileName ? fileName : "Drop log file here or click to upload"}
        </p>
        <p className="text-muted-foreground text-sm mt-1">.log, .txt, .csv — max 10 MB</p>
      </div>

      {/* Text Input */}
      <div className="glass-card rounded-lg p-1">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono text-muted-foreground">paste_logs</span>
        </div>
        <textarea
          value={logText}
          onChange={(e) => { setLogText(e.target.value); setFileName(null); }}
          placeholder="Paste your security logs here..."
          className="w-full h-48 bg-transparent font-mono text-sm text-foreground p-4 resize-none focus:outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => logText.trim() && onSubmit(logText)}
          disabled={!logText.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <FileText className="h-4 w-4" />
          Analyze Logs
        </Button>
        <Button
          variant="outline"
          onClick={() => { setLogText(SAMPLE_LOGS); setFileName(null); }}
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          Load Sample Logs
        </Button>
      </div>
    </div>
  );
}
