import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ChatList from "@/components/ChatList";
import ConversationView from "@/components/ConversationView";
import JobsTab from "@/components/JobsTab";
import PeopleTab from "@/components/PeopleTab";
import SettingsTab from "@/components/SettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

const ChatPage = () => {
  const { user } = useAuth();
  const { activeConversation, loading } = useChat();
  const [activeTab, setActiveTab] = useState<Tab>("chats");

  const showConversation = activeConversation !== null;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeTab) {
      case "chats":
        return <ChatList />;
      case "jobs":
        return <JobsTab />;
      case "people":
        return <PeopleTab />;
      case "settings":
        return <SettingsTab />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar user={user} />

      {/* Mobile layout */}
      <div className="md:hidden flex-1 pt-14 pb-16 overflow-hidden">
        {showConversation ? (
          <ConversationView />
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 pt-14 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[360px] flex-shrink-0 border-r border-border flex flex-col bg-card">
          {/* Desktop tabs */}
          <div className="flex gap-1 p-3 border-b border-border">
            {(["chats", "jobs", "people", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 rounded-lg py-2 font-display text-[10px] uppercase tracking-wider transition-all duration-200 ${
                  activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <ConversationView />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <p className="font-body text-sm text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {!showConversation && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadChats={0} newJobs={0} />
      )}
    </div>
  );
};

export default ChatPage;
