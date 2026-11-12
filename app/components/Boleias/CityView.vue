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
    <section class="page-intro">
      <UContainer class="py-6 sm:py-8">
        <h1 class="page-title">
          Boleias {{ fromCity }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Viagens entre cidades com partida {{ fromCity }}, com pagamento protegido por Multicaixa Express.
        </p>

        <SearchForm
          :initial="{ from: city.slug }"
          class="mt-6"
          isCompact
        />
      </UContainer>
    </section>

    <UiPage>
      <UiSplit>
        <section v-if="routesFrom.length">
          <h2 class="section-title">
            Destinos com partida {{ fromCity }}
          </h2>

          <BoleiasRouteList
            :routes="routesFrom"
            show="destination"
            class="mt-4"
          />
        </section>

        <section>
          <h2 class="section-title">
            Próximas viagens
          </h2>

          <BoleiasTripList
            v-if="trips.length"
            :trips="trips"
            class="mt-4"
          />

          <UiEmptyState
            v-else
            class="mt-4"
            icon="i-lucide-car-front"
            :title="`Ainda não há viagens marcadas com partida ${fromCity}`"
            description="Vai viajar de carro? Publique a viagem e divida os custos."
          >
            <UButton
              to="/publicar"
              variant="soft"
            >
              Publicar viagem
            </UButton>
          </UiEmptyState>
        </section>

        <template #aside>
          <HomePaymentProtected isCompact />

          <UCard v-if="routesTo.length">
            <h2 class="card-title">
              Boleias {{ placeWith('para', city.slug, city.name) }}
            </h2>

            <BoleiasRouteList
              :routes="routesTo"
              show="origin"
              class="mt-3"
              isStacked
            />
          </UCard>
        </template>
      </UiSplit>
    </UiPage>
  </div>
</template>
