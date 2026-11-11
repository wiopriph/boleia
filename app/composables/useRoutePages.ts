import type { Place } from '~/composables/usePlaces';
import type { TripRow } from '~/composables/useSearch';
import type { Views } from '~~/types/rpc';


export type RouteStat = Views<'route_stats'>;
export type RouteCity = Pick<Place, 'slug' | 'name' | 'province'>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TRIPS_LIMIT = 10;

// Data of the SEO pages /boleias/<origem>-<destino> and /boleias/<origem> (spec section 12).
export function useRoutePages() {
  const db = useDb();

  // Place slugs contain hyphens ("porto-amboim"), so every hyphen is a possible split point.
  async function fetchRoute(slug: string): Promise<RouteStat | null> {
    if (!SLUG_PATTERN.test(slug)) {
      return null;
    }

    const parts = slug.split('-');
    const candidates = parts.slice(1).map((_, index) => {
      const origin = parts.slice(0, index + 1).join('-');
      const destination = parts.slice(index + 1).join('-');

      return `and(origin_slug.eq.${origin},destination_slug.eq.${destination})`;
    });

    if (!candidates.length) {
      return null;
    }

    const { data } = await db.from('route_stats')
      .select('*')
      .or(candidates.join(','))
      .limit(1)
      .maybeSingle();

    return data;
  }

  async function fetchCity(slug: string): Promise<RouteCity | null> {
    if (!SLUG_PATTERN.test(slug)) {
      return null;
    }

    const { data } = await db.from('places')
      .select('slug, name, province')
      .eq('slug', slug)
      .eq('is_active', true)
      .neq('kind', 'landmark')
      .maybeSingle();

    return data;
  }

  async function fetchRoutes(column: 'origin_slug' | 'destination_slug', slug: string): Promise<RouteStat[]> {
    const { data } = await db.from('route_stats')
      .select('*')
      .eq(column, slug)
      .order('trips_upcoming', { ascending: false })
      .order(column === 'origin_slug' ? 'destination_name' : 'origin_name');

    return data ?? [];
  }

  async function fetchUpcomingTrips(originSlug: string, destinationSlug?: string): Promise<TripRow[]> {
    let query = db.from('trips_public')
      .select('*')
      .eq('origin_slug', originSlug)
      .gt('departure_at', new Date().toISOString());

    if (destinationSlug) {
      query = query.eq('destination_slug', destinationSlug);
    }

    const { data } = await query
      .order('departure_at')
      .order('id')
      .limit(TRIPS_LIMIT);

    return data ?? [];
  }

  return { fetchRoute, fetchCity, fetchRoutes, fetchUpcomingTrips };
}

// trips of several days in one list: grouped by Luanda day, like the search results
export function groupTripsByDay(trips: TripRow[]) {
  const groups: { day: string, items: TripRow[] }[] = [];

  for (const trip of trips) {
    const day = toLuandaDateString(trip.departure_at);
    const last = groups.at(-1);

    if (last?.day === day) {
      last.items.push(trip);
    } else {
      groups.push({ day, items: [trip] });
    }
  }

  return groups;
}
