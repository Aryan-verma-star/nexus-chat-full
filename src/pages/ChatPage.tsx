import { useState } from "react";
import { MessageSquare } from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav, { type Tab } from "@/components/BottomNav";
import ChatList from "@/components/ChatList";
import ConversationView from "@/components/ConversationView";
import JobsTab from "@/components/JobsTab";
import PeopleTab from "@/components/PeopleTab";
import SettingsTab from "@/components/SettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { user } = useAuth();
  const { activeConversation } = useChat();
  const [activeTab, setActiveTab] = useState<Tab>("chats");

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <TopBar user={user} />

      <div className="flex-1 flex overflow-hidden">
        <div className={`
          w-full md:w-[380px] md:flex-shrink-0 md:border-r md:border-border
          ${activeConversation ? "hidden md:block" : "block"}
        `}>
          {activeTab === "chats" && <ChatList />}
          {activeTab === "jobs" && <JobsTab />}
          {activeTab === "people" && <PeopleTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>

        <div className={`
          flex-1 min-w-0
          ${activeConversation ? "block" : "hidden md:flex md:items-center md:justify-center"}
        `}>
          {activeConversation ? (
            <ConversationView />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-8">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-foreground font-semibold text-lg">Welcome to NEXUS</p>
              <p className="text-muted-foreground text-sm mt-1">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
