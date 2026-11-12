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
  <UiPage>
    <UiPageHeader
      title="As minhas reservas"
      description="Os teus lugares reservados e os detalhes de cada viagem."
    />

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

    <UiEmptyState
      v-else
      icon="i-lucide-ticket"
      :title="tab === 'upcoming' ? 'Não tem reservas para as próximas viagens.' : 'Ainda não tem reservas anteriores.'"
      class="mt-6"
    >
      <UButton
        v-if="tab === 'upcoming'"
        to="/"
        icon="i-lucide-search"
      >
        Procurar boleia
      </UButton>
    </UiEmptyState>
  </UiPage>
</template>
