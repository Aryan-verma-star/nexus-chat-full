import { useState } from "react";
import { MessageSquare } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ChatList from "@/components/ChatList";
import ConversationView from "@/components/ConversationView";
import JobsTab from "@/components/JobsTab";
import PeopleTab from "@/components/PeopleTab";
import SettingsTab from "@/components/SettingsTab";

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
  };

  const handleBack = () => {
    setActiveChat(null);
  };

  // On mobile, show conversation full screen when active
  const showConversation = activeChat !== null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "chats":
        return <ChatList onSelectChat={handleSelectChat} activeChat={activeChat || undefined} />;
      case "jobs":
        return <JobsTab />;
      case "people":
        return <PeopleTab onSelectUser={(userId) => handleSelectChat(`dm-${userId}`)} />;
      case "settings":
        return <SettingsTab />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar notificationCount={3} />

      {/* Mobile layout */}
      <div className="md:hidden flex-1 pt-14 pb-16 overflow-hidden">
        {showConversation ? (
          <ConversationView conversationId={activeChat} onBack={handleBack} />
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
                onClick={() => { setActiveTab(tab); setActiveChat(null); }}
                className={`press flex-1 rounded-lg py-2 font-display text-[10px] uppercase tracking-wider transition-all duration-200 ${
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
          {activeChat ? (
            <ConversationView conversationId={activeChat} onBack={handleBack} />
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
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadChats={4} newJobs={2} />
      )}
    </div>
  );
};

export default ChatPage;
