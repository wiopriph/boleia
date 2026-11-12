<script setup lang="ts">
import type { RouteStat } from '~/composables/useRoutePages';


type RouteItem = Pick<RouteStat, 'origin_slug' | 'origin_name' | 'destination_slug' | 'destination_name' | 'trips_upcoming' | 'min_price_kz'>;

// which end of the route is shown: both on the home page, one on a city or route page
withDefaults(defineProps<{
  routes: RouteItem[]
  show?: 'both' | 'origin' | 'destination'
  withImages?: boolean
  // one column, for a side column
  isStacked?: boolean
}>(), { show: 'both', withImages: false, isStacked: false });

// Decorative scenes, not photos of route endpoints. Keep other route lists compact.
function routeImage(route: RouteItem) {
  const highlandCities = ['huambo', 'lubango'];

  if (highlandCities.includes(route.destination_slug)) {
    return '/images/angola-highlands.webp';
  }

  return highlandCities.includes(route.origin_slug) ? '/images/angola-road-card.webp' : '/images/angola-coast.webp';
}
</script>

<template>
  <ul
    class="grid gap-3"
    :class="[isStacked ? '' : 'sm:grid-cols-2', withImages ? 'lg:grid-cols-4' : '']"
  >
    <li
      v-for="route in routes"
      :key="`${route.origin_slug}-${route.destination_slug}`"
    >
      <NuxtLink
        :to="routePath(route.origin_slug, route.destination_slug)"
        class="surface-link group h-full text-sm"
        :class="withImages ? 'flex overflow-hidden p-0 sm:block' : ''"
      >
        <img
          v-if="withImages"
          :src="routeImage(route)"
          alt=""
          width="640"
          height="427"
          loading="lazy"
          decoding="async"
          class="h-28 w-24 shrink-0 object-cover sm:w-full"
        >

        <div
          class="flex flex-wrap items-center justify-between gap-3"
          :class="withImages ? 'min-w-0 flex-1 p-4' : ''"
        >
          <span class="font-medium">
            <template v-if="show === 'both'">{{ route.origin_name }} <span class="text-muted">para</span> {{ route.destination_name }}</template>

            <template v-else-if="show === 'origin'">{{ route.origin_name }}</template>

            <template v-else>{{ route.destination_name }}</template>
          </span>

          <span
            class="inline-flex items-center gap-3 text-muted"
            :class="withImages ? 'w-full justify-between' : ''"
          >
            <span>
              <template v-if="route.trips_upcoming && route.min_price_kz">desde {{ formatKz(route.min_price_kz) }}</template>

              <template v-else>sem viagens marcadas</template>
            </span>

            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </NuxtLink>
    </li>
  </ul>
</template>
