import type { TripPublic } from '~/composables/useTrip';

// Shared by /viagem/<id> and /t/<id>: loads the trip, sets the 404 status and the social tags.
// Head composables run before the await (reactive getters), the rest inside runWithContext,
// because the Nuxt instance is not available after an await in a composable.
export async function useTripPage(canonicalPath: (trip: TripPublic) => string) {
  const nuxtApp = useNuxtApp();
  const route = useRoute();
  const requestEvent = useRequestEvent();
  const siteUrl = useSiteConfig().url.replace(/\/$/, '');
  const { fetchTrip } = useTrip();
  const id = String(route.params.id ?? '');

  const trip = useState<TripPublic | null>(`trip:${id}`, () => null);

  const title = computed(() => trip.value ?
    `${trip.value.origin_name} para ${trip.value.destination_name}, ${formatDayLong(trip.value.departure_at)} às ${formatTime(trip.value.departure_at)}` :
    'Viagem indisponível');
  const description = computed(() => trip.value ?
    `${formatKz(trip.value.price_per_seat_kz)} por lugar, ${seatsLabel(trip.value.seats_available)}, condutor ${trip.value.driver_name} - pagamento protegido com Multicaixa Express.` :
    'Esta viagem já não está disponível.');

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    robots: () => (trip.value ? 'index, follow' : 'noindex'),
  });

  useHead({
    link: () => (trip.value ? [{ rel: 'canonical', href: `${siteUrl}${canonicalPath(trip.value)}` }] : []),
  });

  const { status } = await useAsyncData(`trip-load:${id}`, async () => {
    trip.value = await fetchTrip(id);

    return true;
  });

  await nuxtApp.runWithContext(() => {
    if (import.meta.server && !trip.value && requestEvent) {
      setResponseStatus(requestEvent, 404);
    }

    if (trip.value) {
      defineOgImage('Trip', {
        origin: trip.value.origin_name,
        destination: trip.value.destination_name,
        day: formatDayLong(trip.value.departure_at),
        time: formatTime(trip.value.departure_at),
        price: formatKz(trip.value.price_per_seat_kz),
        seats: seatsLabel(trip.value.seats_available),
        driver: trip.value.driver_name ?? '',
      });
    }
  });

  return { trip, isLoading: computed(() => status.value === 'pending') };
}
