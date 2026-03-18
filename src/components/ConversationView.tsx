import { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile } from "lucide-react";
import { mockMessages, mockConversations } from "@/data/mockData";

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
}

const currentUserId = "1"; // Yoon

const ConversationView = ({ conversationId, onBack }: ConversationViewProps) => {
  const conv = mockConversations.find((c) => c.id === conversationId);
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: `m${Date.now()}`,
      senderId: currentUserId,
      senderName: "Yoon",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text" as const,
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  if (!conv) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-3 py-3 bg-background">
        <button onClick={onBack} className="press p-1 md:hidden">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface font-display text-sm text-primary">
            {conv.name.charAt(0)}
          </div>
          {conv.type === "direct" && conv.isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-base font-semibold text-foreground truncate">{conv.name}</p>
          <p className="font-body text-[11px] text-muted-foreground">
            {conv.type === "direct"
              ? conv.isOnline ? <span className="text-primary">online</span> : "last seen 2h ago"
              : `${conv.memberCount} members`}
          </p>
        </div>
        <button className="press p-2">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Date separator */}
        <div className="flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 font-body text-[11px] text-muted-foreground">
            Today
          </span>
        </div>

        {messages.map((msg, i) => {
          const isSent = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isSent ? "justify-end" : "justify-start"} animate-slide-up`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2.5 ${
                  isSent
                    ? "bg-gradient-sent text-primary-foreground rounded-2xl rounded-br-md"
                    : "bg-surface text-foreground rounded-2xl rounded-bl-md"
                }`}
              >
                <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`mt-1 flex items-center gap-1 ${isSent ? "justify-end" : ""}`}>
                  <span className={`font-body text-[11px] ${isSent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.timestamp}
                  </span>
                  {isSent && (
                    <span className={`text-[11px] ${msg.isRead ? "text-primary-foreground/80" : "text-primary-foreground/40"}`}>
                      ✓✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card px-3 py-2.5">
        <div className="flex items-end gap-2">
          <button className="press p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:glow"
              style={{ maxHeight: 120 }}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <Smile className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="press flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-sent text-primary-foreground transition-all duration-200 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
