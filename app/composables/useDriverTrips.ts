import type {
  DriverArrivedResult, EnterPinResult, PriceHint, PublishTripPayload, PublishTripResult, Tables, UpdateTripPayload,
} from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


type PlaceRef = Pick<Tables<'places'>, 'name' | 'slug'>;

export interface DriverTrip extends Tables<'trips'> {
  origin: PlaceRef | null
  destination: PlaceRef | null
  vehicle: Pick<Tables<'vehicles'>, 'make' | 'model' | 'color' | 'seats_total'> | null
}

const TRIP_SELECT = '*, origin:places!trips_origin_place_id_fkey(name, slug), destination:places!trips_destination_place_id_fkey(name, slug), vehicle:vehicles!trips_vehicle_id_fkey(make, model, color, seats_total)';

// Driver side: own trips are read from the table (RLS: owner), bookings from my_bookings by trip.
export function useDriverTrips() {
  const db = useDb();
  const { rpc } = useRpc();
  const userId = useUserId();

  async function fetchMyTrips(): Promise<DriverTrip[]> {
    if (!userId.value) {
      return [];
    }

    const { data } = await db.from('trips').select(TRIP_SELECT)
      .eq('driver_id', userId.value)
      .order('departure_at', { ascending: true });

    return (data ?? []) as unknown as DriverTrip[];
  }

  async function fetchMyTrip(id: string): Promise<DriverTrip | null> {
    if (!userId.value || !/^[0-9a-f-]{36}$/i.test(id)) {
      return null;
    }

    const { data } = await db.from('trips').select(TRIP_SELECT)
      .eq('id', id)
      .eq('driver_id', userId.value)
      .maybeSingle();

    return data as unknown as DriverTrip | null;
  }

  async function fetchTripBookings(tripId: string): Promise<BookingRow[]> {
    const { data } = await db.from('my_bookings').select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    return (data ?? []).filter(isVisibleToDriver);
  }

  async function fetchPriceHint(originPlaceId: string, destinationPlaceId: string) {
    return rpc<PriceHint | null>('price_hint', { origin_place_id: originPlaceId, destination_place_id: destinationPlaceId });
  }

  async function publishTrip(payload: PublishTripPayload) {
    return rpc<PublishTripResult>('publish_trip', { payload: payload as never });
  }

  async function updateTrip(tripId: string, payload: UpdateTripPayload) {
    await rpc('update_trip', { trip_id: tripId, payload: payload as never });
  }

  async function cancelTrip(tripId: string, reason?: string) {
    await rpc('cancel_trip', { trip_id: tripId, reason });
  }

  async function confirmIntent(tripId: string) {
    await rpc('confirm_trip_intent', { trip_id: tripId });
  }

  async function markArrived(tripId: string) {
    return rpc<DriverArrivedResult>('driver_arrived', { trip_id: tripId });
  }

  async function createReturnTrip(tripId: string, departureAt: string) {
    return rpc('create_return_trip', { trip_id: tripId, departure_at: departureAt });
  }

  async function respondBooking(bookingId: string, shouldAccept: boolean, reason?: string) {
    await rpc('respond_booking', { booking_id: bookingId, accept: shouldAccept, reason });
  }

  async function enterPin(bookingId: string, pin: string) {
    return rpc<EnterPinResult>('enter_pin', { booking_id: bookingId, pin });
  }

  async function markNoShow(bookingId: string) {
    await rpc('mark_no_show', { booking_id: bookingId });
  }

  return {
    fetchMyTrips, fetchMyTrip, fetchTripBookings, fetchPriceHint, publishTrip, updateTrip, cancelTrip,
    confirmIntent, markArrived, createReturnTrip, respondBooking, enterPin, markNoShow,
  };
}
