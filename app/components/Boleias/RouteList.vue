<script setup lang="ts">
import type { RouteStat } from '~/composables/useRoutePages';


type RouteItem = Pick<RouteStat, 'origin_slug' | 'origin_name' | 'destination_slug' | 'destination_name' | 'trips_upcoming' | 'min_price_kz'>;

// which end of the route is shown: both on the home page, one on a city or route page
withDefaults(defineProps<{
  routes: RouteItem[]
  show?: 'both' | 'origin' | 'destination'
}>(), { show: 'both' });
</script>

<template>
  <ul class="grid gap-2 sm:grid-cols-2">
    <li
      v-for="route in routes"
      :key="`${route.origin_slug}-${route.destination_slug}`"
    >
      <NuxtLink
        :to="routePath(route.origin_slug, route.destination_slug)"
        class="flex items-center justify-between gap-3 rounded-lg border border-default p-3 text-sm transition-colors hover:border-primary"
      >
        <span class="font-medium">
          <template v-if="show === 'both'">{{ route.origin_name }} <span class="text-muted">para</span> {{ route.destination_name }}</template>

          <template v-else-if="show === 'origin'">{{ route.origin_name }}</template>

          <template v-else>{{ route.destination_name }}</template>
        </span>

        <span class="shrink-0 text-right text-muted">
          <template v-if="route.trips_upcoming && route.min_price_kz">desde {{ formatKz(route.min_price_kz) }}</template>

          <template v-else>sem viagens marcadas</template>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
