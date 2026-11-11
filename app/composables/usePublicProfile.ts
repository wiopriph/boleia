import type { Enums, Views } from '~~/types/rpc';
import type { TripRow } from '~/composables/useSearch';


export type PublicProfile = Views<'profiles_public'>;
export type PublicReview = Views<'reviews_public'>;

const REVIEWS_PAGE = 20;

// Public trust data: profiles_public and reviews_public are readable by anyone, phone never included.
export function usePublicProfile() {
  const db = useDb();
  const { rpc } = useRpc();

  function isUuid(id: string) {
    return /^[0-9a-f-]{36}$/i.test(id);
  }

  async function fetchProfile(id: string): Promise<PublicProfile | null> {
    if (!isUuid(id)) {
      return null;
    }

    const { data } = await db.from('profiles_public').select('*')
      .eq('id', id)
      .maybeSingle();

    return data;
  }

  // keyset by created_at, newest first
  async function fetchReviews(targetId: string, options: { limit?: number, before?: string } = {}): Promise<PublicReview[]> {
    if (!isUuid(targetId)) {
      return [];
    }

    let query = db.from('reviews_public').select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? REVIEWS_PAGE);

    if (options.before) {
      query = query.lt('created_at', options.before);
    }

    const { data } = await query;

    return data ?? [];
  }

  async function fetchUpcomingTrips(driverId: string): Promise<TripRow[]> {
    if (!isUuid(driverId)) {
      return [];
    }

    const { data } = await db.from('trips_public').select('*')
      .eq('driver_id', driverId)
      .gt('departure_at', new Date().toISOString())
      .order('departure_at', { ascending: true })
      .limit(5);

    return data ?? [];
  }

  async function reportUser(targetId: string, reason: Enums<'report_reason'>, details?: string) {
    return rpc('report_user', { target_id: targetId, reason, details });
  }

  return { fetchProfile, fetchReviews, fetchUpcomingTrips, reportUser, reviewsPageSize: REVIEWS_PAGE };
}
