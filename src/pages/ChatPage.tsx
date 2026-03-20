import { useState, Component, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import TopBar from "@/components/TopBar";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ChatList from "@/components/ChatList";
import ConversationView from "@/components/ConversationView";
import JobsTab from "@/components/JobsTab";
import PeopleTab from "@/components/PeopleTab";
import SettingsTab from "@/components/SettingsTab";

class ErrorBoundary extends Component<{ children: ReactNode; name: string }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-foreground font-semibold text-sm mb-1">{this.props.name} error</p>
          <p className="text-muted-foreground text-xs font-mono break-all max-w-xs">{this.state.error}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: "" })}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatPage() {
  const { user } = useAuth();
  let activeConversation: any = null;
  let setActiveConversation: any = null;

  try {
    const chat = useChat();
    activeConversation = chat.activeConversation;
    setActiveConversation = chat.setActiveConversation;
  } catch (e) {
    console.error("[ChatPage] useChat unavailable:", e);
  }

  const [activeTab, setActiveTab] = useState<Tab>("chats");

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (setActiveConversation) {
      setActiveConversation(null);
    }
  };

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <TopBar
        user={user}
        activeConversation={activeConversation}
        onBack={() => setActiveConversation && setActiveConversation(null)}
      />

      {/* ======== DESKTOP: Side-by-side layout ======== */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-card">
          <div className="flex-1 overflow-hidden">
            {activeTab === "chats" && (
              <ErrorBoundary name="ChatList"><ChatList /></ErrorBoundary>
            )}
            {activeTab === "jobs" && (
              <ErrorBoundary name="Jobs"><JobsTab /></ErrorBoundary>
            )}
            {activeTab === "people" && (
              <ErrorBoundary name="People"><PeopleTab /></ErrorBoundary>
            )}
            {activeTab === "settings" && (
              <ErrorBoundary name="Settings"><SettingsTab /></ErrorBoundary>
            )}
          </div>
          {/* Desktop tab bar */}
          <div className="flex border-t border-border">
            {(["chats", "jobs", "people", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-display text-[10px] uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Right conversation panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {activeConversation ? (
            <ErrorBoundary name="Conversation"><ConversationView /></ErrorBoundary>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-foreground font-semibold text-lg">Welcome to NEXUS</p>
              <p className="text-muted-foreground text-sm mt-1">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* ======== MOBILE: Single panel with bottom nav ======== */}
      <div className="flex-1 flex flex-col overflow-hidden md:hidden">
        {/* Tab content or conversation */}
        <div className="flex-1 overflow-hidden relative">
          {/* Conversation overlay */}
          <div
            className="absolute inset-0 flex flex-col z-10 bg-background"
            style={{ display: activeConversation ? "flex" : "none" }}
          >
            <ErrorBoundary name="Conversation"><ConversationView /></ErrorBoundary>
          </div>

          {/* Tab content */}
          <div className="h-full overflow-hidden" style={{ display: activeConversation ? "none" : "block" }}>
            {activeTab === "chats" && (
              <ErrorBoundary name="ChatList"><ChatList /></ErrorBoundary>
            )}
            {activeTab === "jobs" && (
              <ErrorBoundary name="Jobs"><JobsTab /></ErrorBoundary>
            )}
            {activeTab === "people" && (
              <ErrorBoundary name="People"><PeopleTab /></ErrorBoundary>
            )}
            {activeTab === "settings" && (
              <ErrorBoundary name="Settings"><SettingsTab /></ErrorBoundary>
            )}
          </div>
        </div>

        {/* Bottom nav — always rendered on mobile */}
        <div className="flex-shrink-0">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>
    </div>
  );
}
