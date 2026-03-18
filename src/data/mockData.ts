export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: string;
  role: "admin" | "member";
  status?: string;
}

export interface MockConversation {
  id: string;
  type: "direct" | "group";
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSender?: string;
  unreadCount: number;
  isOnline?: boolean;
  memberCount?: number;
}

export interface MockMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  isRead: boolean;
  replyTo?: { senderName: string; content: string };
}

export interface MockJob {
  id: string;
  platform: "fiverr" | "upwork";
  title: string;
  description: string;
  budget: string;
  deadline: string;
  status: "new" | "claimed" | "completed";
  claimedBy?: string;
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  { id: "1", username: "yoon", displayName: "Yoon", isOnline: true, lastSeen: "now", role: "admin", status: "Building the future" },
  { id: "2", username: "cipher", displayName: "Cipher", isOnline: true, lastSeen: "now", role: "member", status: "In the matrix" },
  { id: "3", username: "nova", displayName: "Nova", isOnline: false, lastSeen: "2h ago", role: "member" },
  { id: "4", username: "ghost", displayName: "Ghost", isOnline: false, lastSeen: "1d ago", role: "member", status: "AFK" },
  { id: "5", username: "zero", displayName: "Zer0", isOnline: true, lastSeen: "now", role: "member", status: "Deploying..." },
];

export const mockConversations: MockConversation[] = [
  { id: "c1", type: "direct", name: "Cipher", lastMessage: "The exploit is ready. Check the repo.", lastMessageTime: "2m", unreadCount: 3, isOnline: true },
  { id: "c2", type: "group", name: "Project Alpha", lastMessage: "Nova: Deployed the fix 🚀", lastMessageTime: "15m", unreadCount: 0, memberCount: 4 },
  { id: "c3", type: "direct", name: "Nova", lastMessage: "Sounds good, let me check.", lastMessageTime: "1h", unreadCount: 1, isOnline: false },
  { id: "c4", type: "group", name: "Ops Room", lastMessage: "Ghost: Server is back online", lastMessageTime: "3h", unreadCount: 0, memberCount: 5 },
  { id: "c5", type: "direct", name: "Zer0", lastMessage: "Can you review my PR?", lastMessageTime: "5h", unreadCount: 0, isOnline: true },
  { id: "c6", type: "group", name: "Job Alerts", lastMessage: "Yoon: New Fiverr gig incoming", lastMessageTime: "1d", unreadCount: 12, memberCount: 3 },
];

export const mockMessages: MockMessage[] = [
  { id: "m1", senderId: "2", senderName: "Cipher", content: "Hey, you online?", timestamp: "10:30 AM", type: "text", isRead: true },
  { id: "m2", senderId: "1", senderName: "Yoon", content: "Yeah, what's up?", timestamp: "10:31 AM", type: "text", isRead: true },
  { id: "m3", senderId: "2", senderName: "Cipher", content: "Found a vulnerability in the client's auth system. Classic JWT misconfiguration.", timestamp: "10:32 AM", type: "text", isRead: true },
  { id: "m4", senderId: "1", senderName: "Yoon", content: "Nice catch. Have you documented it?", timestamp: "10:33 AM", type: "text", isRead: true },
  { id: "m5", senderId: "2", senderName: "Cipher", content: "Already pushed to the report repo. Also added the PoC script.", timestamp: "10:34 AM", type: "text", isRead: true },
  { id: "m6", senderId: "1", senderName: "Yoon", content: "Perfect. I'll review it tonight and we can submit tomorrow.", timestamp: "10:35 AM", type: "text", isRead: true },
  { id: "m7", senderId: "2", senderName: "Cipher", content: "The exploit is ready. Check the repo.", timestamp: "10:40 AM", type: "text", isRead: false },
];

export const mockJobs: MockJob[] = [
  { id: "j1", platform: "fiverr", title: "React Dashboard Development", description: "Build a modern analytics dashboard with charts, data tables, and real-time updates. Must use React and TypeScript.", budget: "$450", deadline: "5 days", status: "new", createdAt: "2h ago" },
  { id: "j2", platform: "upwork", title: "API Security Audit", description: "Perform a comprehensive security audit on a REST API built with Node.js and Express.", budget: "$800", deadline: "7 days", status: "claimed", claimedBy: "Cipher", createdAt: "1d ago" },
  { id: "j3", platform: "fiverr", title: "Mobile App Bug Fixes", description: "Fix critical bugs in a React Native application. Issues with navigation and state management.", budget: "$200", deadline: "2 days", status: "completed", claimedBy: "Nova", createdAt: "3d ago" },
  { id: "j4", platform: "upwork", title: "Database Optimization", description: "Optimize PostgreSQL queries and indexes for a high-traffic SaaS application.", budget: "$350", deadline: "4 days", status: "new", createdAt: "5h ago" },
];
