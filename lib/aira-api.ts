import { api } from './api';

export interface AiraMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiraConversation {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface AiraUsage {
  used: number;
  limit: number;
  remaining: number;
}

export const AIRA_MAX_CHARS = 1000;

/** Starter prompts shown on an empty chat. Plain questions Klear AI can answer from the creator's own numbers. */
export const AIRA_STARTERS = [
  'How can I grow my engagement?',
  'Give me 5 reel ideas for my niche',
  'How should I price a brand collab?',
  'Write a pitch message to a brand',
  'What should my bio say?',
];

export const airaApi = {
  usage: () => api.get('/api/aira/usage') as Promise<AiraUsage>,
  conversations: () =>
    api.get('/api/aira/conversations') as Promise<{ conversations: AiraConversation[] }>,
  messages: (conversationId: string) =>
    api.get(`/api/aira/conversations/${conversationId}/messages`) as Promise<{
      messages: AiraMessage[];
    }>,
  remove: (conversationId: string) => api.delete(`/api/aira/conversations/${conversationId}`),
  chat: (message: string, conversationId?: string | null) =>
    api.post('/api/aira/chat', { message, conversationId: conversationId ?? null }) as Promise<{
      conversation: AiraConversation;
      userMessage: AiraMessage;
      reply: AiraMessage;
      usage: AiraUsage;
    }>,
};
