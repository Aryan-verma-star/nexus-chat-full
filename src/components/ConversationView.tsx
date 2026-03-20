import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile, Loader2, Download, ExternalLink, FileText } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTypingNames = (userIds: string[], users: any[]): string => {
  if (userIds.length === 0) return "";
  const names = userIds
    .map(id => users.find(u => u.id === id)?.display_name || users.find(u => u.id === id)?.username)
    .filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return `${names[0]} and ${names.length - 1} others are typing`;
};

export default function ConversationView() {
  const { user } = useAuth();
  const {
    activeConversation, messages, typingUsers, users,
    sendTextMessage, sendFileMessage, setTypingStatus,
    messagesLoading, sendingMessage, setActiveConversation,
    loadMoreMessages, hasMore,
  } = useChat();

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !(emojiRef.current as any).contains(e.target)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener("click", handleClick);
    }
    return () => document.removeEventListener("click", handleClick);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const ref = inputRef.current;
    if (!ref) return;
    const start = ref.selectionStart ?? input.length;
    const end = ref.selectionEnd ?? input.length;
    const newInput = input.slice(0, start) + emoji + input.slice(end);
    setInput(newInput);
    setShowEmoji(false);
    setTimeout(() => {
      ref.focus();
      ref.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const quickEmojis = ["😀", "😂", "😍", "🥰", "👍", "❤️", "🔥", "🎉", "✅", "💯", "👏", "🤔", "😅", "😊", "😎", "🤝"];

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendTextMessage(input);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await sendFileMessage(file);
    }
    e.target.value = "";
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setTypingStatus(value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMore && !messagesLoading) {
      await loadMoreMessages();
    }
  }, [hasMore, messagesLoading, loadMoreMessages]);

  if (!activeConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
          <Send className="h-8 w-8 text-primary/40" />
        </div>
        <p className="font-body text-sm text-muted-foreground">Select a conversation to start messaging</p>
      </div>
    );
  }

  const currentUserId = user?.id || "";

  const getConvName = () => {
    if (activeConversation.type === 'group') {
      return activeConversation.name || 'Unnamed Group';
    }
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    return other?.profile?.display_name || other?.profile?.username || '(No name)';
  };

  const getConvSubtitle = () => {
    if (activeConversation.type === 'group') {
      return `${activeConversation.members?.length || 0} member${activeConversation.members?.length !== 1 ? 's' : ''}`;
    }
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    if (other?.profile?.is_online) return 'Online';
    return other?.profile?.custom_status || 'Offline';
  };

  const getConvAvatarUrl = () => {
    if (activeConversation.type === 'group') return activeConversation.avatar_url || null;
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    return other?.profile?.avatar_url || null;
  };

  const convName = getConvName();
  const convSubtitle = getConvSubtitle();
  const convAvatarUrl = getConvAvatarUrl();
  const convInitial = convName[0]?.toUpperCase() || '?';

  const isOtherOnline = () => {
    if (activeConversation.type !== 'direct') return false;
    const other = activeConversation.members?.find(m => {
      const mid = m.user_id || (m.profile as any)?.id;
      return mid !== user?.id;
    });
    return other?.profile?.is_online || false;
  };

  const typingNames = getTypingNames(typingUsers, users);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-top">
        <button
          onClick={() => setActiveConversation(null)}
          className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center text-muted-foreground active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {activeConversation.type === 'group' ? (
              <span className="text-base">👥</span>
            ) : convAvatarUrl ? (
              <img src={convAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-foreground font-bold text-sm">{convInitial}</span>
            )}
          </div>
          {activeConversation.type === 'direct' && isOtherOnline() && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-[15px] truncate">{convName}</p>
          <p className="text-muted-foreground text-xs truncate">{convSubtitle}</p>
        </div>
        <button className="p-2 transition-transform active:scale-95">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={messagesLoading}
              className="rounded-full px-3 py-1 font-display text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {messagesLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <span className="rounded-full bg-muted px-3 py-1 font-body text-[11px] text-muted-foreground">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isSent = msg.sender_id === currentUserId;
          const isFirstInGroup = i === 0 || messages[i - 1].sender_id !== msg.sender_id;
          const showSender = !isSent && activeConversation.type === "group" && isFirstInGroup;

          return (
            <div
              key={msg.id}
              className={`flex ${isSent ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              <div className={`max-w-[80%] ${isSent ? "order-2" : "order-1"}`}>
                {showSender && msg.sender && (
                  <p className="mb-1 font-body text-[11px] text-primary">
                    {msg.sender.display_name || msg.sender.username}
                  </p>
                )}

                {/* Message bubble */}
                <div
                  className={`px-3.5 py-2.5 ${
                    isSent
                      ? "bg-gradient-sent text-primary-foreground rounded-2xl rounded-br-md"
                      : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border"
                  }`}
                >
                  {/* Image message */}
                  {msg.type === "image" && msg.file_url && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-1.5"
                    >
                      <img
                        src={msg.file_url}
                        alt={msg.file_name || "Image"}
                        className="max-w-[260px] rounded-lg object-cover"
                        loading="lazy"
                      />
                    </a>
                  )}

                  {/* File message */}
                  {msg.type === "file" && msg.file_url && (
                    <a
                      href={msg.file_url}
                      download={msg.file_name || "file"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1.5 flex items-center gap-2 rounded-lg bg-background/20 p-2 hover:bg-background/30"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-body text-xs font-medium">{msg.file_name || "File"}</p>
                        {msg.file_size && (
                          <p className="font-body text-[10px] opacity-70">{formatFileSize(msg.file_size)}</p>
                        )}
                      </div>
                      <Download className="h-3.5 w-3.5 flex-shrink-0 ml-auto" />
                    </a>
                  )}

                  {/* Text content */}
                  {msg.content && (
                    <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Footer */}
                  <div className={`mt-1 flex items-center gap-1 ${isSent ? "justify-end" : ""}`}>
                    <span className={`font-body text-[11px] ${isSent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isSent && (
                      <span className={`text-[11px] ${msg.is_edited ? "text-primary-foreground/80" : "text-primary-foreground/40"}`}>
                        {msg.is_edited ? "edited" : "✓✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingNames && (
          <div className="flex items-center gap-2 py-1 pl-3">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground typing-dot" />
            </div>
            <span className="font-body text-xs text-muted-foreground">{typingNames}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — flex item at bottom of flex container */}
      <div className="flex-shrink-0 bg-card border-t border-border">
        <div className="flex items-end gap-2 p-2 max-w-screen-lg mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground transition-colors active:scale-90"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />

          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-muted px-4 py-2.5 pr-10 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji); }}
            >
              <Smile className="h-4 w-4" />
            </button>

            {showEmoji && (
              <div
                ref={emojiRef}
                className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-2xl shadow-lg p-3 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-4 gap-1" style={{ minWidth: 200 }}>
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-muted transition-colors active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {input.trim() ? (
            <button
              onClick={handleSend}
              disabled={sendingMessage}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            >
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
