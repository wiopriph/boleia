import type { Tables, Views } from '~~/types/rpc';


export type Conversation = Views<'my_conversations'>;
export type Message = Tables<'messages'>;

export const MESSAGE_MAX_LENGTH = 1000;

const PAGE_SIZE = 50;

export function useChat() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  // First message from the trip page: send_message creates the conversation (passenger, trip) and
  // returns the message id, so the conversation is looked up afterwards for the redirect.
  async function askDriver(tripId: string, body: string): Promise<string | null> {
    await rpc('send_message', { body, trip_id: tripId });

    if (!userId.value) {
      return null;
    }

    const { data } = await db.from('my_conversations')
      .select('id')
      .eq('trip_id', tripId)
      .eq('passenger_id', userId.value)
      .maybeSingle();

    return data?.id ?? null;
  }

  async function fetchConversations(): Promise<Conversation[]> {
    const { data } = await db.from('my_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    return data ?? [];
  }

  async function fetchConversation(id: string): Promise<Conversation | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return null;
    }

    const { data } = await db.from('my_conversations').select('*')
      .eq('id', id)
      .maybeSingle();

    return data;
  }

  // keyset by id (spec section 7): newest page first, older pages via beforeId; returned oldest-first
  async function fetchMessages(conversationId: string, beforeId?: number): Promise<Message[]> {
    let query = db.from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('id', { ascending: false })
      .limit(PAGE_SIZE);

    if (beforeId !== undefined) {
      query = query.lt('id', beforeId);
    }

    const { data } = await query;

    return (data ?? []).reverse();
  }

  async function sendMessage(conversationId: string, body: string) {
    return rpc('send_message', { body, conversation_id: conversationId });
  }

  async function markRead(conversationId: string, upToMessageId: number) {
    await rpc('mark_read', { conversation_id: conversationId, up_to_message_id: upToMessageId });
  }

  return {
    askDriver, fetchConversations, fetchConversation, fetchMessages, sendMessage, markRead,
    pageSize: PAGE_SIZE,
  };
}
