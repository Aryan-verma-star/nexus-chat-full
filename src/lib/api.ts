import { supabase, User, Conversation, Message, Job, Notification } from './supabase';

const API_URL = 'https://Nexus-chat-app-nexus-chat.hf.space';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nexus_access_token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();

  if (!text) {
    throw new Error('Empty response');
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON: ' + text.substring(0, 100));
  }

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

export const api = {
  auth: {
    login: async (emailOrUsername: string, password: string) => {
      const data = await fetchApi<{
        success: boolean;
        data: { user: User; session: { access_token: string; refresh_token: string; expires_at: number } };
        error: string | null;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrUsername.includes('@') ? emailOrUsername : undefined, username: !emailOrUsername.includes('@') ? emailOrUsername : undefined, password }),
      });

      if (data.success && data.data.session) {
        localStorage.setItem('nexus_access_token', data.data.session.access_token);
        localStorage.setItem('nexus_refresh_token', data.data.session.refresh_token);
        localStorage.setItem('nexus_user', JSON.stringify(data.data.user));
      }

      return data;
    },

    logout: async () => {
      await fetchApi('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('nexus_access_token');
      localStorage.removeItem('nexus_refresh_token');
      localStorage.removeItem('nexus_user');
    },

    me: async () => {
      const data = await fetchApi<{ success: boolean; data: { user: User; unread_notification_count: number }; error: string | null }>('/api/auth/me');
      return data.data;
    },
  },

  users: {
    list: async () => {
      const data = await fetchApi<{ success: boolean; data: User[]; error: string | null }>('/api/users');
      return data.data;
    },

    get: async (id: string) => {
      const data = await fetchApi<{ success: boolean; data: User; error: string | null }>(`/api/users/${id}`);
      return data.data;
    },

    update: async (id: string, updates: Partial<User>) => {
      const data = await fetchApi<{ success: boolean; data: User; error: string | null }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.data;
    },
  },

  conversations: {
    list: async () => {
      const data = await fetchApi<{ success: boolean; data: Conversation[]; error: string | null }>('/api/conversations');
      return data.data;
    },

    get: async (id: string) => {
      const data = await fetchApi<{ success: boolean; data: Conversation; error: string | null }>(`/api/conversations/${id}`);
      return data.data;
    },

    create: async (type: 'direct' | 'group', params: { user_id?: string; name?: string; member_ids?: string[]; description?: string }) => {
      const data = await fetchApi<{ success: boolean; data: Conversation; error: string | null }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ type, ...params }),
      });
      return data.data;
    },

    getMessages: async (id: string, page = 1, limit = 50) => {
      return fetchApi<{
        success: boolean;
        data: Message[];
        error: string | null;
        pagination: { page: number; limit: number; total: number; hasMore: boolean };
      }>(`/api/conversations/${id}/messages?page=${page}&limit=${limit}`);
    },

    sendMessage: async (conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text', replyTo?: string) => {
      const data = await fetchApi<{ success: boolean; data: Message; error: string | null }>(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, type, reply_to: replyTo }),
      });
      return data.data;
    },

    markRead: async (conversationId: string) => {
      await fetchApi(`/api/conversations/${conversationId}/read`, { method: 'POST' });
    },

    getMembers: async (conversationId: string) => {
      const data = await fetchApi<{ success: boolean; data: any[]; error: string | null }>(`/api/conversations/${conversationId}/members`);
      return data.data;
    },

    addMember: async (conversationId: string, userId: string, role?: 'admin' | 'member') => {
      await fetchApi(`/api/conversations/${conversationId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role }),
      });
    },

    removeMember: async (conversationId: string, userId?: string) => {
      await fetchApi(`/api/conversations/${conversationId}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ user_id: userId }),
      });
    },
  },

  jobs: {
    list: async (status?: string, platform?: string, page = 1, limit = 20) => {
      let url = `/api/jobs?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (platform) url += `&platform=${platform}`;
      return fetchApi<{
        success: boolean;
        data: Job[];
        error: string | null;
        pagination: { page: number; limit: number; total: number; hasMore: boolean };
      }>(url);
    },

    get: async (id: string) => {
      const data = await fetchApi<{ success: boolean; data: Job & { comments: any[] }; error: string | null }>(`/api/jobs/${id}`);
      return data.data;
    },

    claim: async (id: string) => {
      const data = await fetchApi<{ success: boolean; data: Job; error: string | null }>(`/api/jobs/${id}/claim`, { method: 'POST' });
      return data.data;
    },

    complete: async (id: string) => {
      const data = await fetchApi<{ success: boolean; data: Job; error: string | null }>(`/api/jobs/${id}/complete`, { method: 'POST' });
      return data.data;
    },

    addComment: async (jobId: string, content: string) => {
      const data = await fetchApi<{ success: boolean; data: any; error: string | null }>(`/api/jobs/${jobId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return data.data;
    },
  },

  notifications: {
    list: async (page = 1, limit = 20) => {
      return fetchApi<{
        success: boolean;
        data: Notification[];
        error: string | null;
        pagination: { page: number; limit: number; total: number; hasMore: boolean };
        unread_count: number;
      }>(`/api/notifications?page=${page}&limit=${limit}`);
    },

    markRead: async (notificationIds: string[]) => {
      await fetchApi('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notification_ids: notificationIds }),
      });
    },

    markAllRead: async () => {
      await fetchApi('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ mark_all: true }),
      });
    },
  },

  messages: {
    search: async (query: string) => {
      const data = await fetchApi<{ success: boolean; data: any[]; error: string | null }>(`/api/messages/search?q=${encodeURIComponent(query)}`);
      return data.data;
    },

    addReaction: async (messageId: string, emoji: string) => {
      await fetchApi('/api/messages/react', {
        method: 'POST',
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
    },

    removeReaction: async (messageId: string, emoji: string) => {
      await fetchApi('/api/messages/react', {
        method: 'DELETE',
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
    },
  },
};

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem('nexus_user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('nexus_access_token');
}
