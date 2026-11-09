import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Tables } from '~~/types/rpc';


type BookingChange = RealtimePostgresChangesPayload<Tables<'bookings'>>;
type Listener = (change: BookingChange) => void;

// One of the three realtime subscriptions (spec section 7): the passenger's own bookings.
// A single channel per browser tab is shared by every screen that mounts this composable.
const passengerListeners = new Set<Listener>();

let passengerChannel: RealtimeChannel | null = null;

export function useRealtimeBookings(onChange: Listener) {
  const db = useDb();
  const userId = useUserId();

  function ensureChannel() {
    if (passengerChannel || !userId.value) {
      return;
    }

    passengerChannel = db
      .channel(`bookings:passenger:${userId.value}`)
      .on<Tables<'bookings'>>('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `passenger_id=eq.${userId.value}`,
      }, (change) => {
        passengerListeners.forEach(listener => listener(change));
      })
      .subscribe();
  }

  function dropChannelIfUnused() {
    if (passengerListeners.size === 0 && passengerChannel) {
      db.removeChannel(passengerChannel);
      passengerChannel = null;
    }
  }

  onMounted(() => {
    passengerListeners.add(onChange);
    ensureChannel();
  });

  onUnmounted(() => {
    passengerListeners.delete(onChange);
    dropChannelIfUnused();
  });
}
