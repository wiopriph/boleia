import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Tables } from '~~/types/rpc';

// Second realtime subscription (spec section 7): bookings on the driver's active trips.
// Lives on the driver screens only; the channel is rebuilt when the set of trips changes.
export function useRealtimeTripBookings(tripIds: MaybeRefOrGetter<string[]>, onChange: () => void) {
  const db = useDb();

  let channel: RealtimeChannel | null = null;

  function drop() {
    if (channel) {
      db.removeChannel(channel);
      channel = null;
    }
  }

  function subscribe(ids: string[]) {
    drop();

    if (!ids.length) {
      return;
    }

    channel = db
      .channel(`bookings:driver:${ids.join(',').slice(0, 60)}`)
      .on<Tables<'bookings'>>('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `trip_id=in.(${ids.join(',')})`,
      }, () => {
        onChange();
      })
      .subscribe();
  }

  onMounted(() => {
    watch(() => toValue(tripIds).join(','), () => subscribe(toValue(tripIds)), { immediate: true });
  });

  onUnmounted(drop);
}
