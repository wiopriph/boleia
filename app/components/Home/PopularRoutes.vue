<script setup lang="ts">
const db = useDb();

const { data: routes } = await useAsyncData('popular-routes', async () => {
  const { data } = await db.from('route_stats')
    .select('origin_slug, origin_name, destination_slug, destination_name, trips_upcoming, min_price_kz')
    .order('trips_upcoming', { ascending: false })
    .order('origin_name')
    .limit(8);

  return data ?? [];
});
</script>

<template>
  <section v-if="routes?.length">
    <h2 class="text-lg font-semibold">
      Rotas populares
    </h2>

    <BoleiasRouteList
      :routes="routes"
      class="mt-3"
    />
  </section>
</template>
