import type { BookingRow } from '~/utils/booking-status';
import type {
  AdminCancelBookingResult, AdminCancelTripResult, AdminStats, AdminUser, DisputeOutcome, ModerationAction, Tables,
} from '~~/types/rpc';


export type AdminProfile = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'phone' | 'avatar_url' | 'status' | 'suspended_until' | 'driver_status' | 'rating_avg' | 'rating_count' | 'trips_driven' | 'trips_ridden' | 'cancels_total' | 'no_shows'>;
export type AdminVerification = Tables<'driver_verifications'> & {
  user: AdminProfile | null
  vehicle: Pick<Tables<'vehicles'>, 'id' | 'make' | 'model' | 'color' | 'year' | 'plate' | 'seats_total'> | null
};
export type AdminReport = Tables<'reports'> & {
  reporter: AdminProfile | null
  target: AdminProfile | null
  booking: BookingRow | null
};
export type AdminPayout = Tables<'payouts'> & { user: AdminProfile | null };
export type AdminDispute = BookingRow & { passenger: AdminProfile | null, driver: AdminProfile | null };
export type AdminTrip = Pick<Tables<'trips'>, 'id' | 'status' | 'departure_at' | 'price_per_seat_kz' | 'seats_offered' | 'seats_available'> & {
  origin: { name: string } | null
  destination: { name: string } | null
};
export type AdminPayment = Pick<Tables<'payments'>, 'id' | 'booking_id' | 'amount_kz' | 'status' | 'refund_kz' | 'paid_at' | 'refunded_at' | 'created_at'>;
export type AdminMessage = Pick<Tables<'messages'>, 'id' | 'sender_id' | 'body' | 'created_at'>;

export interface AdminUserDetail {
  user: AdminUser
  payoutMethod: Tables<'profiles'>['payout_method']
  verifications: Tables<'driver_verifications'>[]
  vehicles: Pick<Tables<'vehicles'>, 'id' | 'make' | 'model' | 'color' | 'year' | 'plate' | 'seats_total' | 'status' | 'verified'>[]
  trips: AdminTrip[]
  bookings: BookingRow[]
  payments: AdminPayment[]
  ledger: Tables<'ledger_entries'>[]
  actions: Tables<'moderation_actions'>[]
  reports: Tables<'reports'>[]
}

const PROFILE_COLUMNS = 'id, display_name, phone, avatar_url, status, suspended_until, driver_status, rating_avg, rating_count, trips_driven, trips_ridden, cancels_total, no_shows';
// only the columns granted to authenticated (boleia-db RLS); provider and refund references stay hidden
const PAYMENT_COLUMNS = 'id, booking_id, amount_kz, status, refund_kz, paid_at, refunded_at, created_at';
const TRIP_COLUMNS = 'id, status, departure_at, price_per_seat_kz, seats_offered, seats_available, origin:places!trips_origin_place_id_fkey(name), destination:places!trips_destination_place_id_fkey(name)';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HISTORY_LIMIT = 30;
const CHAT_LIMIT = 200;

// Admin reads rely on RLS (is_admin() sees every row), every action is an RPC (spec section 11).
export function useAdmin() {
  const db = useDb();
  const { rpc } = useRpc();

  async function fetchProfiles(ids: (string | null | undefined)[]): Promise<Map<string, AdminProfile>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];

    if (!unique.length) {
      return new Map();
    }

    const { data } = await db.from('profiles').select(PROFILE_COLUMNS)
      .in('id', unique);

    return new Map((data ?? []).map(profile => [profile.id, profile]));
  }

  function fetchStats() {
    return rpc<AdminStats>('admin_stats', {} as never);
  }

  async function fetchVerifications(): Promise<AdminVerification[]> {
    const { data } = await db.from('driver_verifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at');
    const rows = data ?? [];

    if (!rows.length) {
      return [];
    }

    const [profiles, { data: vehicles }] = await Promise.all([
      fetchProfiles(rows.map(row => row.user_id)),
      db.from('vehicles')
        .select('id, make, model, color, year, plate, seats_total')
        .in('id', rows.map(row => row.vehicle_id)),
    ]);

    return rows.map(row => ({
      ...row,
      user: profiles.get(row.user_id) ?? null,
      vehicle: vehicles?.find(vehicle => vehicle.id === row.vehicle_id) ?? null,
    }));
  }

  function reviewVerification(id: string, shouldApprove: boolean, reason?: string) {
    return rpc('review_verification', { verification_id: id, approve: shouldApprove, reason });
  }

  async function documentUrl(path: string | null): Promise<string | null> {
    if (!path) {
      return null;
    }

    const { data } = await db.storage.from('verifications').createSignedUrl(path, 600);

    return data?.signedUrl ?? null;
  }

  async function fetchReports(): Promise<AdminReport[]> {
    const { data } = await db.from('reports')
      .select('*')
      .in('status', ['open', 'reviewed'])
      .order('created_at');
    const rows = data ?? [];
    const bookingIds = rows.map(row => row.booking_id).filter((id): id is string => !!id);
    const [profiles, bookings] = await Promise.all([
      fetchProfiles(rows.flatMap(row => [row.reporter_id, row.target_user_id])),
      bookingIds.length ?
        db.from('my_bookings').select('*')
          .in('id', bookingIds) :
        null,
    ]);

    return rows.map(row => ({
      ...row,
      reporter: row.reporter_id ? profiles.get(row.reporter_id) ?? null : null,
      target: profiles.get(row.target_user_id) ?? null,
      booking: (bookings?.data?.find(booking => booking.id === row.booking_id) ?? null) as BookingRow | null,
    }));
  }

  function resolveReport(id: string, outcome: 'reviewed' | 'dismissed', note?: string) {
    return rpc('admin_resolve_report', { report_id: id, outcome, note });
  }

  function moderate(targetId: string, action: ModerationAction, reason: string, days?: number, reportId?: string) {
    return rpc('admin_moderate', { target_id: targetId, action, reason, days, report_id: reportId });
  }

  async function fetchDisputes(): Promise<AdminDispute[]> {
    const { data } = await db.from('my_bookings')
      .select('*')
      .eq('status', 'disputed')
      .order('departure_at');
    const rows = (data ?? []) as BookingRow[];
    const profiles = await fetchProfiles(rows.flatMap(row => [row.passenger_id, row.driver_id]));

    return rows.map(row => ({
      ...row,
      passenger: row.passenger_id ? profiles.get(row.passenger_id) ?? null : null,
      driver: row.driver_id ? profiles.get(row.driver_id) ?? null : null,
    }));
  }

  function resolveDispute(bookingId: string, outcome: DisputeOutcome, amountKz?: number) {
    return rpc('resolve_dispute', { booking_id: bookingId, outcome, amount_kz: amountKz });
  }

  // RLS opens a chat to the admin only while its booking is disputed or an open report points at it
  async function fetchBookingChat(bookingId: string): Promise<AdminMessage[] | null> {
    const { data: conversation } = await db.from('conversations')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (!conversation) {
      return null;
    }

    const { data } = await db.from('messages')
      .select('id, sender_id, body, created_at')
      .eq('conversation_id', conversation.id)
      .order('id')
      .limit(CHAT_LIMIT);

    return data ?? [];
  }

  async function fetchPayouts(): Promise<AdminPayout[]> {
    const { data } = await db.from('payouts')
      .select('*')
      .in('status', ['requested', 'processing'])
      .order('created_at');
    const rows = data ?? [];
    const profiles = await fetchProfiles(rows.map(row => row.user_id));

    return rows.map(row => ({ ...row, user: profiles.get(row.user_id) ?? null }));
  }

  function markPayout(id: string, status: 'processing' | 'paid' | 'failed', ref?: string) {
    return rpc('mark_payout', { payout_id: id, new_status: status, ref });
  }

  function searchUsers(query: string) {
    return rpc<AdminUser[]>('admin_search_users', { q: query, lim: 20 });
  }

  async function fetchUserDetail(id: string): Promise<AdminUserDetail | null> {
    if (!UUID_PATTERN.test(id)) {
      return null;
    }

    const [user] = await searchUsers(id);

    if (!user) {
      return null;
    }

    const [profile, verifications, vehicles, trips, bookings, payments, ledger, actions, reports] = await Promise.all([
      db.from('profiles').select('payout_method')
        .eq('id', id)
        .maybeSingle(),
      db.from('driver_verifications').select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      db.from('vehicles').select('id, make, model, color, year, plate, seats_total, status, verified')
        .eq('owner_id', id)
        .order('created_at'),
      db.from('trips').select(TRIP_COLUMNS)
        .eq('driver_id', id)
        .order('departure_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      db.from('my_bookings').select('*')
        .eq('passenger_id', id)
        .order('departure_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      db.from('payments').select(PAYMENT_COLUMNS)
        .eq('payer_id', id)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      db.from('ledger_entries').select('*')
        .eq('user_id', id)
        .order('id', { ascending: false })
        .limit(HISTORY_LIMIT),
      db.from('moderation_actions').select('*')
        .eq('target_user_id', id)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
      db.from('reports').select('*')
        .eq('target_user_id', id)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT),
    ]);

    return {
      user,
      payoutMethod: profile.data?.payout_method ?? null,
      verifications: verifications.data ?? [],
      vehicles: vehicles.data ?? [],
      trips: (trips.data ?? []) as unknown as AdminTrip[],
      bookings: (bookings.data ?? []) as BookingRow[],
      payments: payments.data ?? [],
      ledger: ledger.data ?? [],
      actions: actions.data ?? [],
      reports: reports.data ?? [],
    };
  }

  function cancelTrip(tripId: string, reason: string) {
    return rpc<AdminCancelTripResult>('admin_cancel_trip', { trip_id: tripId, reason });
  }

  function cancelBooking(bookingId: string, reason: string) {
    return rpc<AdminCancelBookingResult>('admin_cancel_booking', { booking_id: bookingId, reason });
  }

  return {
    fetchStats,
    fetchVerifications,
    reviewVerification,
    documentUrl,
    fetchReports,
    resolveReport,
    moderate,
    fetchDisputes,
    resolveDispute,
    fetchBookingChat,
    fetchPayouts,
    markPayout,
    searchUsers,
    fetchUserDetail,
    cancelTrip,
    cancelBooking,
  };
}

// queue sizes for the admin navigation; refreshed after every action that closes an item
export function useAdminStats() {
  const { fetchStats } = useAdmin();

  return useAsyncData('admin-stats', fetchStats);
}

export function refreshAdminStats() {
  return refreshNuxtData('admin-stats');
}
