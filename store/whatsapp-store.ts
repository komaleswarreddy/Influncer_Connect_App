import { create } from 'zustand';
import {
  connectWhatsapp,
  disconnectWhatsapp,
  fetchWhatsappConversations,
  fetchWhatsappMessages,
  getWhatsappStatus,
  sendWhatsappReply,
  type WhatsappConversation,
  type WhatsappMessage,
  type WhatsappNumberInfo,
} from '@/lib/whatsapp-api';

interface WhatsappState {
  isConnected: boolean;
  number: WhatsappNumberInfo | null;
  conversations: WhatsappConversation[];
  activeMessages: WhatsappMessage[];
  activeWindowOpen: boolean;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendReply: (conversationId: string, text: string) => Promise<void>;
  clearError: () => void;
}

export const useWhatsappStore = create<WhatsappState>((set, get) => ({
  isConnected: false,
  number: null,
  conversations: [],
  activeMessages: [],
  activeWindowOpen: false,
  isLoading: false,
  isSending: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await getWhatsappStatus();
      set({ isConnected: res.connected, number: res.number ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load WhatsApp status',
        isLoading: false,
      });
    }
  },

  connect: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await connectWhatsapp();
      set({ isConnected: res.connected, number: res.number ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to connect WhatsApp',
        isLoading: false,
      });
      throw err;
    }
  },

  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await disconnectWhatsapp();
      set({ isConnected: false, number: null, conversations: [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to disconnect WhatsApp',
        isLoading: false,
      });
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await fetchWhatsappConversations();
      set({ conversations, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load conversations',
        isLoading: false,
      });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchWhatsappMessages(conversationId);
      set({ activeMessages: res.messages, activeWindowOpen: res.windowOpen, isLoading: false });
      // Reading a conversation clears its unread badge server-side — reflect that locally too.
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load messages',
        isLoading: false,
      });
    }
  },

  sendReply: async (conversationId: string, text: string) => {
    set({ isSending: true, error: null });
    try {
      const message = await sendWhatsappReply(conversationId, text);
      set((state) => ({ activeMessages: [...state.activeMessages, message], isSending: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isSending: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
