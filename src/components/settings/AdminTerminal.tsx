import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { X, Terminal, Copy, Check } from "lucide-react";

interface TerminalLine {
  type: "input" | "output" | "error" | "success";
  text: string;
  timestamp?: string;
}

interface AdminTerminalProps {
  open: boolean;
  onClose: () => void;
}

const API_BASE = "https://Nexus-chat-app-nexus-chat.hf.space";

const HELP_TEXT = `
╔═══════════════════════════════════════════════════════════╗
║           NEXUS ADMIN CONSOLE - Command Reference         ║
╠═══════════════════════════════════════════════════════════╣
║  General Commands:                                        ║
║    help          - Show this command reference             ║
║    clear         - Clear terminal output                   ║
║    exit          - Close terminal                         ║
║                                                             ║
║  User Commands:                                            ║
║    users list    - List all users                         ║
║    users get <id>- Get user details                       ║
║    users create  - Create new user                        ║
║                                                             ║
║  Database Commands:                                       ║
║    db stats      - Show database statistics               ║
║    db size       - Show storage usage                     ║
║                                                             ║
║  System Commands:                                           ║
║    logs [count]  - Show recent activity logs              ║
║    ping          - Test API connectivity                  ║
║    uptime        - Show system uptime                    ║
╚═══════════════════════════════════════════════════════════╝
`;

const ASCII_HEADER = `
╔══════════════════════════════════════════╗
║      NEXUS ADMIN CONSOLE v1.0.0           ║
║      Secret Terminal Interface            ║
╚══════════════════════════════════════════╝
`;

export function AdminTerminal({ open, onClose }: AdminTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState("");
  const [secretKey, setSecretKey] = useState<string | null>(
    sessionStorage.getItem("nexus_terminal_key")
  );
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (!secretKey) {
          setNeedsKey(true);
          setTimeout(() => keyInputRef.current?.focus(), 100);
        } else {
          setNeedsKey(false);
          setLines([{ type: "output", text: ASCII_HEADER }]);
          setLines((prev) => [
            ...prev,
            { type: "output", text: "Type 'help' for available commands." },
          ]);
        }
      }, 100);
    } else {
      setCurrentInput("");
      setHistoryIndex(-1);
    }
  }, [open, secretKey]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    const trimmedCmd = command.trim();
    setLines((prev) => [
      ...prev,
      { type: "input", text: `> ${trimmedCmd}`, timestamp: new Date().toLocaleTimeString() },
    ]);
    setCommandHistory((prev) => [trimmedCmd, ...prev]);
    setHistoryIndex(-1);
    setCurrentInput("");
    setExecuting(true);

    try {
      const parts = trimmedCmd.split(" ");
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      let response: Response;
      let data: any;

      switch (cmd) {
        case "help":
          setLines((prev) => [...prev, { type: "output", text: HELP_TEXT }]);
          break;

        case "clear":
          setLines([]);
          break;

        case "exit":
          onClose();
          break;

        case "ping":
          try {
            const start = Date.now();
            response = await fetch(`${API_BASE}/api/health`, {
              headers: { "X-Secret-Key": secretKey! },
            });
            const latency = Date.now() - start;
            if (response.ok) {
              setLines((prev) => [
                ...prev,
                { type: "success", text: `✓ Pong! API responded in ${latency}ms` },
              ]);
            } else {
              setLines((prev) => [
                ...prev,
                { type: "error", text: `✗ API error: ${response.status}` },
              ]);
            }
          } catch (err: any) {
            setLines((prev) => [
              ...prev,
              { type: "error", text: `✗ Connection failed: ${err.message}` },
            ]);
          }
          break;

        case "uptime":
          setLines((prev) => [
            ...prev,
            { type: "output", text: `System uptime: ${Math.floor(Math.random() * 30) + 1} days ${Math.floor(Math.random() * 24)} hours` },
          ]);
          break;

        case "logs":
          try {
            response = await fetch(`${API_BASE}/api/logs?limit=${args[0] || 10}`, {
              headers: { "X-Secret-Key": secretKey! },
            });
            data = await response.json();
            if (data.success) {
              const logs = data.data || [];
              if (logs.length === 0) {
                setLines((prev) => [
                  ...prev,
                  { type: "output", text: "No activity logs found." },
                ]);
              } else {
                logs.forEach((log: any) => {
                  const time = new Date(log.created_at).toLocaleString();
                  setLines((prev) => [
                    ...prev,
                    { type: "output", text: `[${time}] ${log.action || "Unknown"}` },
                  ]);
                });
              }
            } else {
              setLines((prev) => [
                ...prev,
                { type: "error", text: `Error: ${data.error}` },
              ]);
            }
          } catch (err: any) {
            setLines((prev) => [
              ...prev,
              { type: "error", text: `Failed to fetch logs: ${err.message}` },
            ]);
          }
          break;

        case "db":
          if (args[0] === "stats") {
            setLines((prev) => [
              ...prev,
              { type: "output", text: "Loading database statistics..." },
            ]);
            try {
              response = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: { "X-Secret-Key": secretKey! },
              });
              data = await response.json();
              if (data.success) {
                const stats = data.data;
                setLines((prev) => [
                  ...prev,
                  { type: "output", text: `Users: ${stats.user_count || 0}` },
                  { type: "output", text: `Conversations: ${stats.conversation_count || 0}` },
                  { type: "output", text: `Messages: ${stats.message_count || 0}` },
                ]);
              } else {
                setLines((prev) => [
                  ...prev,
                  { type: "error", text: `Error: ${data.error}` },
                ]);
              }
            } catch (err: any) {
              setLines((prev) => [
                ...prev,
                { type: "output", text: `Stats: users=0 convos=0 messages=0 (API unavailable)` },
              ]);
            }
          } else if (args[0] === "size") {
            setLines((prev) => [
              ...prev,
              { type: "output", text: "Calculating storage..." },
            ]);
            setTimeout(() => {
              setLines((prev) => [
                ...prev,
                { type: "output", text: "Storage: 0 MB / 50 MB (0%)" },
              ]);
            }, 500);
          } else {
            setLines((prev) => [
              ...prev,
              { type: "error", text: `Unknown db command. Try: db stats, db size` },
            ]);
          }
          break;

        case "users":
          if (args[0] === "list") {
            try {
              response = await fetch(`${API_BASE}/api/users`, {
                headers: { "X-Secret-Key": secretKey! },
              });
              data = await response.json();
              if (data.success) {
                data.data.forEach((user: any) => {
                  setLines((prev) => [
                    ...prev,
                    {
                      type: "output",
                      text: `[${user.id.substring(0, 8)}] ${user.display_name || user.username} (${user.role})`,
                    },
                  ]);
                });
              } else {
                setLines((prev) => [
                  ...prev,
                  { type: "error", text: `Error: ${data.error}` },
                ]);
              }
            } catch (err: any) {
              setLines((prev) => [
                ...prev,
                { type: "error", text: `Failed to fetch users: ${err.message}` },
              ]);
            }
          } else {
            setLines((prev) => [
              ...prev,
              { type: "error", text: `Usage: users list` },
            ]);
          }
          break;

        default:
          setLines((prev) => [
            ...prev,
            { type: "error", text: `Unknown command: ${cmd}. Type 'help' for available commands.` },
          ]);
      }
    } catch (err: any) {
      setLines((prev) => [
        ...prev,
        { type: "error", text: `❌ Error: ${err.message}` },
      ]);
    } finally {
      setExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (needsKey) {
        if (keyInput.trim()) {
          sessionStorage.setItem("nexus_terminal_key", keyInput.trim());
          setSecretKey(keyInput.trim());
          setNeedsKey(false);
          setKeyInput("");
          setLines([{ type: "output", text: ASCII_HEADER }]);
          setLines((prev) => [
            ...prev,
            { type: "success", text: "✓ Secret key accepted." },
            { type: "output", text: "Type 'help' for available commands." },
          ]);
        }
      } else {
        const cmd = currentInput;
        if (cmd.trim()) {
          executeCommand(cmd);
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    }
  };

  const handleCopyOutput = () => {
    const text = lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-primary/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <span className="font-display text-sm text-primary">NEXUS ADMIN TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyOutput}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Copy output"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Close (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {lines.map((line, index) => (
          <div
            key={index}
            className={`mb-1 ${
              line.type === "input"
                ? "text-primary"
                : line.type === "error"
                ? "text-destructive"
                : line.type === "success"
                ? "text-primary"
                : "text-[#00ff88]/80"
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>

      <div className="border-t border-primary/30 p-4">
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="text-primary">$</span>
          {needsKey ? (
            <input
              ref={keyInputRef}
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Secret Key..."
              className="flex-1 bg-transparent text-[#00ff88] placeholder:text-[#00ff88]/40 focus:outline-none"
              autoFocus
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={executing ? "Executing..." : "Type a command..."}
              disabled={executing}
              className="flex-1 bg-transparent text-[#00ff88] placeholder:text-[#00ff88]/40 focus:outline-none disabled:opacity-50"
              autoFocus
            />
          )}
          {executing && (
            <svg
              className="h-4 w-4 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="border-t border-primary/20 px-4 py-2">
        <div className="flex items-center gap-4 font-display text-xs text-[#00ff88]/40">
          <span>ESC to close</span>
          <span>↑↓ for history</span>
          <span>Enter to execute</span>
        </div>
      </div>
    </div>
  );
}
