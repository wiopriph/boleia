import type { Views } from '~~/types/rpc';


export type TripPublic = Views<'trips_public'>;

// trips_public only carries published/full trips: anything else reads as "not available".
export function useTrip() {
  const db = useDb();

  async function fetchTrip(id: string): Promise<TripPublic | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return null;
    }

    const { data } = await db.from('trips_public').select('*')
      .eq('id', id)
      .maybeSingle();

    return data;
  }

  return { fetchTrip };
}
