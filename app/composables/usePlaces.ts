import type { Tables } from '~~/types/rpc';


export type Place = Pick<Tables<'places'>, 'id' | 'slug' | 'name' | 'province' | 'kind' | 'aliases'>;

const CACHE_KEY = 'boleia:places';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface PlacesCache {
  savedAt: number
  items: Place[]
}

function readCache(): Place[] | null {
  if (!import.meta.client) {
    return null;
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const cache = JSON.parse(raw) as PlacesCache;

    return Date.now() - cache.savedAt < CACHE_TTL_MS ? cache.items : null;
  } catch {
    return null;
  }
}

function writeCache(items: Place[]) {
  if (!import.meta.client) {
    return;
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items } satisfies PlacesCache));
  } catch {
    // storage may be unavailable (private mode); the list still works for this page view
  }
}

// Active places (60 rows): fetched once per session, cached a day in the browser (spec section 7).
export function usePlaces() {
  const db = useDb();
  const places = useState<Place[]>('places', () => []);

  async function ensureLoaded() {
    if (places.value.length) {
      return places.value;
    }

    const cached = readCache();

    if (cached?.length) {
      places.value = cached;

      return cached;
    }

    const { data } = await db.from('places')
      .select('id, slug, name, province, kind, aliases')
      .eq('is_active', true)
      .order('kind')
      .order('name');

    places.value = data ?? [];
    writeCache(places.value);

    return places.value;
  }

  // origin and destination of a trip are cities or towns; landmarks are pickup details
  const cities = computed(() => places.value.filter(place => place.kind !== 'landmark'));
  const landmarks = computed(() => places.value.filter(place => place.kind === 'landmark'));

  function bySlug(slug: string | null | undefined) {
    return slug ? places.value.find(place => place.slug === slug) ?? null : null;
  }

  return { places, cities, landmarks, ensureLoaded, bySlug };
}
