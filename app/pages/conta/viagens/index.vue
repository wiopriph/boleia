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
  <UContainer class="max-w-2xl py-8">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">
        As minhas viagens
      </h1>

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

    <div
      v-else
      class="mt-10 flex flex-col items-center gap-4 text-center"
    >
      <UIcon
        name="i-lucide-car"
        class="size-10 text-muted"
      />

      <p class="text-muted">
        {{ tab === 'upcoming' ? 'Não tem viagens publicadas.' : 'Ainda não tem viagens anteriores.' }}
      </p>
    </div>
  </UContainer>
</template>
