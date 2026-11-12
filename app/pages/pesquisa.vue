<script setup lang="ts">
import type { SearchParams } from '~/composables/useSearch';
import type { TimeOfDay } from '~/utils/trip';


const route = useRoute();
const { bySlug, ensureLoaded } = usePlaces();

await ensureLoaded();

const params = computed<SearchParams | null>(() => {
  const parsed = parseSearchQuery(route.query);

  if (!parsed.from || !parsed.to) {
    return null;
  }

  return {
    from: parsed.from,
    to: parsed.to,
    date: parsed.date ?? toLuandaDateString(),
    seats: parsed.seats ?? 1,
  };
});

const origin = computed(() => bySlug(params.value?.from));
const destination = computed(() => bySlug(params.value?.to));
const isRouteKnown = computed(() => !!origin.value && !!destination.value);

const { trips, hasMore, isLoading, isLoadingMore, error, loadMore } = useSearch(params);

const times = ref<TimeOfDay[]>([]);
const maxPrice = ref<number | null>(null);

watch(params, () => {
  times.value = [];
  maxPrice.value = null;
});

const filtered = computed(() => trips.value.filter((trip) => {
  if (times.value.length && !times.value.includes(timeOfDay(trip.departure_at))) {
    return false;
  }

  if (maxPrice.value !== null && trip.price_per_seat_kz > maxPrice.value) {
    return false;
  }

  return true;
}));

// the RPC returns the requested day plus its neighbours, so results are grouped by Luanda day
const groups = computed(() => groupTripsByDay(filtered.value));

const prices = computed(() => trips.value.map(trip => trip.price_per_seat_kz));
const hasActiveFilters = computed(() => times.value.length > 0 || maxPrice.value !== null);
const canGoToPreviousDay = computed(() => !!params.value && params.value.date > toLuandaDateString());

function dayLink(offset: number) {
  if (!params.value) {
    return '/';
  }

  return { path: '/pesquisa', query: toSearchQuery({ ...params.value, date: addDays(params.value.date, offset) }) };
}

const title = computed(() => isRouteKnown.value && params.value ?
  `Boleias de ${origin.value!.name} para ${destination.value!.name}, ${formatDayLong(params.value.date)}` :
  'Pesquisar boleias');

useSeoMeta({
  title,
  description: () => isRouteKnown.value ?
    `Boleias de ${origin.value!.name} para ${destination.value!.name}: horários, preços por lugar e condutores. Pagamento protegido com Multicaixa Express.` :
    'Pesquise boleias entre cidades de Angola.',
  robots: 'noindex, follow',
});

// a shared search link still gets a preview image
defineOgImage('Page', {
  title: isRouteKnown.value ? `${origin.value!.name} para ${destination.value!.name}` : 'Boleias entre cidades',
  subtitle: 'Horários, preços por lugar e condutores',
});
</script>

<template>
  <div>
    <div class="page-intro">
      <UContainer class="py-6 sm:py-8">
        <p class="eyebrow mb-4">
          Encontra o teu caminho
        </p>

        <SearchForm
          :initial="params ?? {}"
          isCompact
        />
      </UContainer>
    </div>

    <UiPage>
      <template v-if="!params || !isRouteKnown">
        <UiPageHeader
          title="Encontrar boleia"
          description="Escolhe o teu caminho e encontra uma viagem entre cidades."
          class="mb-6"
        />

        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-search"
          title="Escolha a origem e o destino"
          description="Use o formulário acima para pesquisar boleias."
        />
      </template>

      <template v-else>
        <h1 class="page-title">
          {{ origin!.name }} <span class="text-muted">para</span> {{ destination!.name }}
        </h1>

        <p class="mt-1 text-sm text-muted">
          {{ formatDayLong(params.date) }} · {{ seatsLabel(params.seats) }}
        </p>

        <div
          v-if="isLoading"
          class="mt-6 space-y-3"
        >
          <USkeleton
            v-for="index in 3"
            :key="index"
            class="h-40 w-full"
          />
        </div>

        <UAlert
          v-else-if="error"
          class="mt-6"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          title="Não foi possível carregar as viagens"
          description="Verifique a ligação e tente novamente."
        />

        <template v-else-if="trips.length">
          <div class="mt-6 grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <aside>
              <SearchFilters
                v-model:times="times"
                v-model:maxPrice="maxPrice"
                :prices="prices"
                class="lg:sticky lg:top-26"
              />
            </aside>

            <div class="min-w-0">
              <p class="text-sm text-muted">
                {{ filtered.length }} {{ filtered.length === 1 ? 'boleia encontrada' : 'boleias encontradas' }} nos dias pesquisados
              </p>

              <p
                v-if="!filtered.length"
                class="mt-8 text-center text-muted"
              >
                Nenhuma viagem corresponde aos filtros.
                <UButton
                  variant="link"
                  @click="times = []; maxPrice = null"
                >
                  Limpar filtros
                </UButton>
              </p>

              <section
                v-for="group in groups"
                :key="group.day"
                class="mt-5"
              >
                <h2 class="group-label mb-3">
                  {{ formatDayLong(group.day) }}
                </h2>

                <div class="space-y-3">
                  <TripCard
                    v-for="trip in group.items"
                    :key="trip.id"
                    :trip="trip"
                  />
                </div>
              </section>

              <div
                v-if="hasMore"
                class="mt-6 flex justify-center"
              >
                <UButton
                  variant="soft"
                  color="neutral"
                  :loading="isLoadingMore"
                  @click="loadMore"
                >
                  Mostrar mais
                </UButton>
              </div>

              <p
                v-else-if="hasActiveFilters"
                class="mt-6 text-center text-xs text-muted"
              >
                Os filtros aplicam-se às viagens já carregadas.
              </p>
            </div>
          </div>
        </template>

        <UiEmptyState
          v-else
          icon="i-lucide-calendar-x"
          title="Sem boleias nesta data"
          description="Experimente os dias à volta ou volte mais tarde: os condutores publicam até ao próprio dia."
          class="mt-8"
        >
          <div class="flex flex-wrap justify-center gap-2">
            <UButton
              v-if="canGoToPreviousDay"
              variant="soft"
              color="neutral"
              icon="i-lucide-chevron-left"
              :to="dayLink(-1)"
            >
              Dia anterior
            </UButton>

            <UButton
              variant="soft"
              color="neutral"
              trailingIcon="i-lucide-chevron-right"
              :to="dayLink(1)"
            >
              Dia seguinte
            </UButton>
          </div>
        </UiEmptyState>
      </template>
    </UiPage>
  </div>
</template>
