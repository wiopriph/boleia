import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '~/composables/useChat';

// Third realtime subscription (spec section 7): inserts of the open conversation only.
// The channel exists while the chat screen is mounted and is removed on leave.
export function useRealtimeChat(conversationId: string, onMessage: (message: Message) => void) {
  const db = useDb();

  let channel: RealtimeChannel | null = null;

  onMounted(() => {
    channel = db
      .channel(`messages:${conversationId}`)
      .on<Message>('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (change) => {
        onMessage(change.new);
      })
      .subscribe();
  });

  onUnmounted(() => {
    if (channel) {
      db.removeChannel(channel);
      channel = null;
    }
  });
}
