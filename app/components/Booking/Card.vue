<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow }>();

const statusText = computed(() => bookingStatusText(props.booking));
const badgeColor = computed(() => (statusText.value.tone === 'neutral' ? 'neutral' : statusText.value.tone));
</script>

<template>
  <NuxtLink
    :to="`/conta/reservas/${booking.id}`"
    class="surface-link"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-muted">
          {{ formatDateTime(booking.departure_at) }}
        </p>

        <p class="font-semibold">
          {{ booking.origin_name }} <span class="font-normal text-muted">para</span> {{ booking.destination_name }}
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
      {{ statusText.detail }}
    </p>

    <div class="mt-3 flex items-center gap-2 text-sm text-muted">
      <UAvatar
        :src="booking.driver_avatar_url ?? undefined"
        :alt="booking.driver_name"
        icon="i-lucide-user-round"
        size="xs"
      />

      <span class="truncate">{{ booking.driver_name }} · {{ booking.vehicle_make }} {{ booking.vehicle_model }} · {{ seatsLabel(booking.seats) }}</span>
    </div>
  </NuxtLink>
</template>
