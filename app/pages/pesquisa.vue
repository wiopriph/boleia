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
  robots: () => (isRouteKnown.value ? 'index, follow' : 'noindex'),
});
</script>

<template>
  <div>
    <div class="border-b border-default bg-elevated/50">
      <UContainer class="py-4">
        <SearchForm
          :initial="params ?? {}"
          isCompact
        />
      </UContainer>
    </div>

    <UContainer class="py-6">
      <template v-if="!params || !isRouteKnown">
        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-search"
          title="Escolha a origem e o destino"
          description="Use o formulário acima para pesquisar boleias."
        />
      </template>

      <template v-else>
        <h1 class="text-xl font-semibold">
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
          <SearchFilters
            v-model:times="times"
            v-model:maxPrice="maxPrice"
            :prices="prices"
            class="mt-5"
          />

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
            class="mt-6"
          >
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
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
        </template>

        <div
          v-else
          class="mt-10 flex flex-col items-center gap-4 text-center"
        >
          <UIcon
            name="i-lucide-calendar-x"
            class="size-10 text-muted"
          />

          <div>
            <p class="font-medium">
              Sem boleias nesta data
            </p>

            <p class="text-sm text-muted">
              Experimente os dias à volta ou volte mais tarde: os condutores publicam até ao próprio dia.
            </p>
          </div>

          <div class="flex gap-2">
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
        </div>
      </template>
    </UContainer>
  </div>
</template>
