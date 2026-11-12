<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'As minhas viagens', robots: 'noindex' });

const { fetchMyTrips } = useDriverTrips();

const { data: trips, status, error, refresh } = await useAsyncData('my-trips', fetchMyTrips, { default: () => [] });

const tab = ref<'upcoming' | 'past'>('upcoming');
const tabItems = [
  { label: 'Próximas', value: 'upcoming' },
  { label: 'Passadas', value: 'past' },
];

const upcoming = computed(() => trips.value.filter(isUpcomingTrip));
const past = computed(() => trips.value.filter(trip => !isUpcomingTrip(trip)).reverse());
const visible = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value));

// seats and statuses change when passengers pay or cancel
useRealtimeTripBookings(() => upcoming.value.map(trip => trip.id), () => {
  refresh();
});
</script>

<template>
  <UiPage>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UiPageHeader
        title="As minhas viagens"
        description="Gere as viagens que publicaste e os pedidos dos passageiros."
      />

      <UButton
        to="/publicar"
        icon="i-lucide-plus"
      >
        Publicar
      </UButton>
    </div>

    <UTabs
      v-model="tab"
      :items="tabItems"
      :content="false"
      class="mt-4"
    />

    <div
      v-if="status === 'pending' && !trips.length"
      class="mt-4 space-y-3"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-28 w-full"
      />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as viagens"
      description="Verifique a ligação e tente novamente."
    />

    <div
      v-else-if="visible.length"
      class="mt-4 space-y-3"
    >
      <DriverTripCard
        v-for="trip in visible"
        :key="trip.id"
        :trip="trip"
      />
    </div>

    <UiEmptyState
      v-else
      icon="i-lucide-car"
      :title="tab === 'upcoming' ? 'Não tem viagens publicadas.' : 'Ainda não tem viagens anteriores.'"
      class="mt-6"
    />
  </UiPage>
</template>
