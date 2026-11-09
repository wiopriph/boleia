<script setup lang="ts">
import type { Views } from '~~/types/rpc';


type RouteStat = Views<'route_stats'>;

const db = useDb();

const { data: routes } = await useAsyncData('popular-routes', async () => {
  const { data } = await db.from('route_stats')
    .select('origin_slug, origin_name, destination_slug, destination_name, trips_upcoming, min_price_kz, next_departure_at')
    .order('trips_upcoming', { ascending: false })
    .order('origin_name')
    .limit(8);

  return (data ?? []) as Pick<RouteStat, 'origin_slug' | 'origin_name' | 'destination_slug' | 'destination_name' | 'trips_upcoming' | 'min_price_kz' | 'next_departure_at'>[];
});

function linkFor(route: NonNullable<typeof routes.value>[number]) {
  return {
    path: '/pesquisa',
    query: toSearchQuery({
      from: route.origin_slug ?? '',
      to: route.destination_slug ?? '',
      date: route.next_departure_at ? toLuandaDateString(route.next_departure_at) : toLuandaDateString(),
      seats: 1,
    }),
  };
}
</script>

<template>
  <section v-if="routes?.length">
    <h2 class="text-lg font-semibold">
      Rotas populares
    </h2>

    <ul class="mt-3 grid gap-2 sm:grid-cols-2">
      <li
        v-for="route in routes"
        :key="`${route.origin_slug}-${route.destination_slug}`"
      >
        <NuxtLink
          :to="linkFor(route)"
          class="flex items-center justify-between gap-3 rounded-lg border border-default p-3 text-sm transition-colors hover:border-primary"
        >
          <span class="font-medium">{{ route.origin_name }} <span class="text-muted">para</span> {{ route.destination_name }}</span>

          <span class="shrink-0 text-right text-muted">
            <template v-if="route.trips_upcoming && route.min_price_kz">desde {{ formatKz(route.min_price_kz) }}</template>

            <template v-else>sem viagens marcadas</template>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
