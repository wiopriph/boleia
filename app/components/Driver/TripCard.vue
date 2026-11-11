<script setup lang="ts">
import type { DriverTrip } from '~/composables/useDriverTrips';


const props = defineProps<{ trip: DriverTrip }>();

const statusText = computed(() => tripStatusText(props.trip.status));
const badgeColor = computed(() => (statusText.value.tone === 'neutral' ? 'neutral' : statusText.value.tone));
const seatsSold = computed(() => props.trip.seats_offered - props.trip.seats_available);
</script>

<template>
  <NuxtLink
    :to="`/conta/viagens/${trip.id}`"
    class="block rounded-xl border border-default bg-default p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-muted">
          {{ formatDateTime(trip.departure_at) }}
        </p>

        <p class="font-semibold">
          {{ trip.origin?.name }} <span class="font-normal text-muted">para</span> {{ trip.destination?.name }}
        </p>
      </div>

      <UBadge
        :color="badgeColor"
        variant="subtle"
        class="shrink-0"
      >
        {{ statusText.label }}
      </UBadge>
    </div>

    <p class="mt-2 text-sm">
      {{ seatsSold }} de {{ trip.seats_offered }} lugares reservados · {{ formatKz(trip.price_per_seat_kz) }} por lugar
    </p>

    <p class="mt-1 text-sm text-muted">
      {{ bookingModeLabel(trip.booking_mode) }}<template v-if="trip.vehicle">
        · {{ trip.vehicle.make }} {{ trip.vehicle.model }}
      </template>
    </p>
  </NuxtLink>
</template>
