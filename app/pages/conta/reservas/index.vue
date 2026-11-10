<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'As minhas reservas', robots: 'noindex' });

const { fetchMyBookings } = useBooking();

const { data: bookings, status, error, refresh } = await useAsyncData('my-bookings', fetchMyBookings, { default: () => [] });

const tab = ref<'upcoming' | 'past'>('upcoming');
const tabItems = [
  { label: 'Próximas', value: 'upcoming' },
  { label: 'Passadas', value: 'past' },
];

const upcoming = computed(() => bookings.value.filter(isUpcomingBooking));
const past = computed(() => bookings.value.filter(booking => !isUpcomingBooking(booking)).reverse());
const visible = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value));

useRealtimeBookings(() => {
  refresh();
});
</script>

<template>
  <UContainer class="max-w-2xl py-8">
    <h1 class="text-2xl font-semibold">
      As minhas reservas
    </h1>

    <UTabs
      v-model="tab"
      :items="tabItems"
      :content="false"
      class="mt-4"
    />

    <div
      v-if="status === 'pending' && !bookings.length"
      class="mt-4 space-y-3"
    >
      <USkeleton
        v-for="index in 3"
        :key="index"
        class="h-32 w-full"
      />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as reservas"
      description="Verifique a ligação e tente novamente."
    />

    <div
      v-else-if="visible.length"
      class="mt-4 space-y-3"
    >
      <BookingCard
        v-for="booking in visible"
        :key="booking.id"
        :booking="booking"
      />
    </div>

    <div
      v-else
      class="mt-10 flex flex-col items-center gap-4 text-center"
    >
      <UIcon
        name="i-lucide-ticket"
        class="size-10 text-muted"
      />

      <p class="text-muted">
        {{ tab === 'upcoming' ? 'Não tem reservas marcadas.' : 'Ainda não tem viagens anteriores.' }}
      </p>

      <UButton
        v-if="tab === 'upcoming'"
        to="/"
        icon="i-lucide-search"
      >
        Procurar boleia
      </UButton>
    </div>
  </UContainer>
</template>
