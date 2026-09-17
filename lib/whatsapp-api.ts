import { api } from './api';

/**
 * WhatsApp Business Platform inbox — calls the server's /api/whatsapp/* routes
 * (server/routes/whatsapp.ts). Unlike Instagram, there's no OAuth here: the platform
 * pre-provisions numbers and "connect" just claims the next free one from the pool.
 */

export interface WhatsappNumberInfo {
  displayPhoneNumber: string;
  verifiedName?: string | null;
  status: 'active' | 'disabled';
}

export interface WhatsappStatusResponse {
  connected: boolean;
  number?: WhatsappNumberInfo;
}

export interface WhatsappConversation {
  id: string;
  customerWaId: string;
  customerProfileName?: string | null;
  customerPhoneDisplay?: string | null;
  status: 'open' | 'closed';
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  lastMessageDirection?: 'inbound' | 'outbound' | null;
  unreadCount: number;
  windowExpiresAt?: string | null;
}

export interface WhatsappMessage {
  id: string;
  conversationId: string;
  waMessageId?: string | null;
  direction: 'inbound' | 'outbound';
  senderType: string;
  messageType: string;
  body?: string | null;
  status: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
}

export async function getWhatsappStatus(): Promise<WhatsappStatusResponse> {
  const data = await api.get('/api/whatsapp/status');
  return data as WhatsappStatusResponse;
}

export async function connectWhatsapp(): Promise<WhatsappStatusResponse> {
  const data = await api.post('/api/whatsapp/connect', {});
  return data as WhatsappStatusResponse;
}

export async function disconnectWhatsapp(): Promise<void> {
  await api.delete('/api/whatsapp/disconnect');
}

export async function fetchWhatsappConversations(): Promise<WhatsappConversation[]> {
  const data = (await api.get('/api/whatsapp/conversations')) as {
    conversations: WhatsappConversation[];
  };
  return data.conversations;
}

export async function fetchWhatsappMessages(conversationId: string): Promise<{
  conversation: WhatsappConversation;
  messages: WhatsappMessage[];
  windowOpen: boolean;
}> {
  const data = await api.get(`/api/whatsapp/conversations/${conversationId}/messages`);
  return data as {
    conversation: WhatsappConversation;
    messages: WhatsappMessage[];
    windowOpen: boolean;
  };
}

export async function sendWhatsappReply(
  conversationId: string,
  text: string
): Promise<WhatsappMessage> {
  const data = (await api.post(`/api/whatsapp/conversations/${conversationId}/messages`, {
    text,
  })) as { message: WhatsappMessage };
  return data.message;
}
