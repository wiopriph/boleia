<script setup lang="ts">
const route = useRoute();
const slug = String(route.params.slug ?? '');
const { fetchRoute, fetchCity, fetchRoutes, fetchUpcomingTrips } = useRoutePages();

// one path for both page kinds (spec section 12): a known route pair wins, then a city
const { data: page } = await useAsyncData(`boleias:${slug}`, async () => {
  const [stat, city] = await Promise.all([fetchRoute(slug), fetchCity(slug)]);

  if (stat) {
    const [trips, fromOrigin, fromDestination, text] = await Promise.all([
      fetchUpcomingTrips(stat.origin_slug, stat.destination_slug),
      fetchRoutes('origin_slug', stat.origin_slug),
      fetchRoutes('origin_slug', stat.destination_slug),
      queryCollection('rotas').path(routePath(stat.origin_slug, stat.destination_slug))
        .first(),
    ]);

    return {
      kind: 'route' as const,
      stat,
      trips,
      text,
      reverse: fromDestination.find(item => item.destination_slug === stat.origin_slug) ?? null,
      otherRoutes: fromOrigin.filter(item => item.destination_slug !== stat.destination_slug),
    };
  }

  if (city) {
    const [trips, routesFrom, routesTo] = await Promise.all([
      fetchUpcomingTrips(city.slug),
      fetchRoutes('origin_slug', city.slug),
      fetchRoutes('destination_slug', city.slug),
    ]);

    return { kind: 'city' as const, city, trips, routesFrom, routesTo };
  }

  return null;
});

if (!page.value) {
  throw createError({ statusCode: 404, fatal: true });
}

const title = computed(() => {
  const current = page.value;

  if (current?.kind === 'route') {
    const price = current.stat.trips_upcoming && current.stat.min_price_kz ? ` desde ${formatKz(current.stat.min_price_kz)}` : '';

    return `Boleias ${routeTitle(current.stat)}${price}`;
  }

  return current ? `Boleias ${placeWith('de', current.city.slug, current.city.name)}` : '';
});

const description = computed(() => {
  const current = page.value;

  if (current?.kind === 'route') {
    const duration = formatDuration(current.stat.minutes);

    return `Encontre e reserve boleias ${routeTitle(current.stat)}${duration ? `, cerca de ${duration} de carro` : ''}. Pagamento protegido com Multicaixa Express.`;
  }

  return current ?
    `Boleias entre cidades com partida ${placeWith('de', current.city.slug, current.city.name)}: destinos, preços e próximas viagens. Pagamento protegido com Multicaixa Express.` :
    '';
});

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
});
</script>

<template>
  <BoleiasRouteView
    v-if="page?.kind === 'route'"
    :stat="page.stat"
    :trips="page.trips"
    :text="page.text"
    :reverse="page.reverse"
    :otherRoutes="page.otherRoutes"
  />

  <BoleiasCityView
    v-else-if="page?.kind === 'city'"
    :city="page.city"
    :trips="page.trips"
    :routesFrom="page.routesFrom"
    :routesTo="page.routesTo"
  />
</template>
