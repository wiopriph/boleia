<script setup lang="ts">
import type { RouteCity, RouteStat } from '~/composables/useRoutePages';
import type { TripRow } from '~/composables/useSearch';


const props = defineProps<{
  city: RouteCity
  trips: TripRow[]
  routesFrom: RouteStat[]
  routesTo: RouteStat[]
}>();

const fromCity = computed(() => placeWith('de', props.city.slug, props.city.name));
</script>

<template>
  <div>
    <section class="bg-elevated/50">
      <UContainer class="max-w-3xl py-8">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
          Boleias {{ fromCity }}
        </h1>

        <p class="mt-2 text-muted">
          Viagens entre cidades com partida {{ fromCity }}, com pagamento protegido por Multicaixa Express.
        </p>

        <UCard class="mt-6">
          <SearchForm :initial="{ from: city.slug }" />
        </UCard>
      </UContainer>
    </section>

    <UContainer class="max-w-3xl space-y-10 py-8">
      <section v-if="routesFrom.length">
        <h2 class="text-lg font-semibold">
          Destinos com partida {{ fromCity }}
        </h2>

        <BoleiasRouteList
          :routes="routesFrom"
          show="destination"
          class="mt-3"
        />
      </section>

      <section>
        <h2 class="text-lg font-semibold">
          Próximas viagens
        </h2>

        <BoleiasTripList
          v-if="trips.length"
          :trips="trips"
          class="mt-4"
        />

        <div
          v-else
          class="mt-3 rounded-xl border border-dashed border-default p-5 text-sm"
        >
          <p class="font-medium">
            Ainda não há viagens marcadas com partida {{ fromCity }}.
          </p>

          <p class="mt-1 text-muted">
            Vai viajar de carro? Publique a viagem e divida os custos.
          </p>

          <UButton
            to="/publicar"
            color="neutral"
            variant="subtle"
            class="mt-3"
          >
            Publicar viagem
          </UButton>
        </div>
      </section>

      <section v-if="routesTo.length">
        <h2 class="text-lg font-semibold">
          Boleias {{ placeWith('para', city.slug, city.name) }}
        </h2>

        <BoleiasRouteList
          :routes="routesTo"
          show="origin"
          class="mt-3"
        />
      </section>

      <HomePaymentProtected />
    </UContainer>
  </div>
</template>
