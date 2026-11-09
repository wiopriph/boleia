import type { BookingPaymentResult } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


export function useBooking() {
  const db = useDb();
  const { rpc } = useRpc();

  async function requestBooking(tripId: string, seats: number, message?: string) {
    return rpc<BookingPaymentResult>('request_booking', { trip_id: tripId, seats, message });
  }

  async function retryPayment(bookingId: string) {
    return rpc<BookingPaymentResult>('retry_payment', { booking_id: bookingId });
  }

  // my_bookings serves both sides; RLS limits it to the caller's own rows
  async function fetchBooking(id: string): Promise<BookingRow | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return null;
    }

    const { data } = await db.from('my_bookings').select('*')
      .eq('id', id)
      .maybeSingle();

    return data;
  }

  return { requestBooking, retryPayment, fetchBooking };
}
