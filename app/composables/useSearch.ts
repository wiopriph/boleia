import type { LocationQuery } from 'vue-router';
import type { Views } from '~~/types/rpc';


export type TripRow = Views<'trips_public'>;

export interface SearchParams {
  from: string
  to: string
  date: string
  seats: number
}

export const MAX_SEATS = 3;

const PAGE_SIZE = 20;

export function parseSearchQuery(query: LocationQuery): Partial<SearchParams> {
  const seats = Number(query.lugares);

  return {
    from: typeof query.de === 'string' && query.de ? query.de : undefined,
    to: typeof query.para === 'string' && query.para ? query.para : undefined,
    date: isValidDateString(query.data) ? query.data : undefined,
    seats: Number.isInteger(seats) && seats >= 1 && seats <= MAX_SEATS ? seats : undefined,
  };
}

export function toSearchQuery(params: SearchParams) {
  return { de: params.from, para: params.to, data: params.date, lugares: String(params.seats) };
}

// search_trips: trips_public rows for date +-1 day, keyset by (departure_at, id).
// The first page is the useAsyncData payload so SSR results survive hydration; "load more" pages
// are appended on the client only.
export function useSearch(params: Ref<SearchParams | null>) {
  const { rpc } = useRpc();

  function key() {
    const current = params.value;

    return current ? `search:${current.from}:${current.to}:${current.date}:${current.seats}` : 'search:empty';
  }

  async function fetchPage(cursor: TripRow | null): Promise<TripRow[]> {
    const current = params.value;

    if (!current) {
      return [];
    }

    const rows = await rpc('search_trips', {
      origin_slug: current.from,
      destination_slug: current.to,
      travel_date: current.date,
      seats: current.seats,
      cursor_departure: cursor?.departure_at ?? undefined,
      cursor_id: cursor?.id ?? undefined,
      page_size: PAGE_SIZE,
    });

    return rows as TripRow[];
  }

  const { data: firstPage, status, error, refresh } = useAsyncData(key, () => fetchPage(null), {
    watch: [params],
    default: () => [] as TripRow[],
  });

  const extraPages = ref<TripRow[]>([]);
  const wasLastPageFull = ref<boolean | null>(null);
  const isLoadingMore = ref(false);

  watch(firstPage, () => {
    extraPages.value = [];
    wasLastPageFull.value = null;
  });

  const trips = computed(() => [...firstPage.value, ...extraPages.value]);
  const hasMore = computed(() => wasLastPageFull.value ?? firstPage.value.length === PAGE_SIZE);
  const isLoading = computed(() => status.value === 'pending');

  async function loadMore() {
    const last = trips.value.at(-1);

    if (!last || isLoadingMore.value) {
      return;
    }

    isLoadingMore.value = true;

    try {
      const rows = await fetchPage(last);

      extraPages.value = [...extraPages.value, ...rows];
      wasLastPageFull.value = rows.length === PAGE_SIZE;
    } finally {
      isLoadingMore.value = false;
    }
  }

  return { trips, hasMore, isLoading, isLoadingMore, error, loadMore, refresh };
}
