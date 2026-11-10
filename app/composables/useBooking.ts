import type { BookingPaymentResult, CancelQuote, CancelResult, RevealContactResult } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


export function useBooking() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

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

  // my_bookings also returns bookings on the caller's own trips; this list is the passenger side only
  async function fetchMyBookings(): Promise<BookingRow[]> {
    if (!userId.value) {
      return [];
    }

    const { data } = await db.from('my_bookings').select('*')
      .eq('passenger_id', userId.value)
      .order('departure_at', { ascending: true });

    return data ?? [];
  }

  async function cancelQuote(bookingId: string) {
    return rpc<CancelQuote>('cancel_quote', { booking_id: bookingId });
  }

  async function cancelBooking(bookingId: string, reason?: string) {
    return rpc<CancelResult>('cancel_booking', { booking_id: bookingId, reason });
  }

  async function confirmTrip(bookingId: string, didHappen: boolean) {
    await rpc('confirm_trip', { booking_id: bookingId, happened: didHappen });
  }

  async function revealContact(bookingId: string) {
    return rpc<RevealContactResult>('reveal_contact', { booking_id: bookingId });
  }

  return {
    requestBooking, retryPayment, fetchBooking, fetchMyBookings, cancelQuote, cancelBooking, confirmTrip, revealContact,
  };
}
