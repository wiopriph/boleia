<script setup lang="ts">
import type { TripRow } from '~/composables/useSearch';


const props = defineProps<{ trip: TripRow }>();

const arrival = computed(() => arrivalAt(props.trip.departure_at, props.trip.duration_minutes));
const isFull = computed(() => props.trip.status === 'full' || props.trip.seats_available <= 0);
</script>

<template>
  <NuxtLink
    :to="`/viagem/${trip.id}`"
    class="block rounded-xl border border-default bg-default p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <span class="font-semibold tabular-nums">{{ formatTime(trip.departure_at) }}</span>

        <span class="font-medium">
          {{ trip.origin_name }}
          <span
            v-if="trip.origin_detail"
            class="font-normal text-muted"
          > · {{ trip.origin_detail }}</span>
        </span>

        <span class="tabular-nums text-muted">{{ arrival ? formatTime(arrival) : '' }}</span>

        <span class="font-medium">
          {{ trip.destination_name }}
          <span
            v-if="trip.destination_detail"
            class="font-normal text-muted"
          > · {{ trip.destination_detail }}</span>
        </span>
      </div>

      <div class="shrink-0 text-right">
        <p class="text-lg font-semibold tabular-nums">
          {{ formatKz(trip.price_per_seat_kz) }}
        </p>

        <p class="text-xs text-muted">
          por lugar
        </p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span
        v-if="trip.duration_minutes"
        class="inline-flex items-center gap-1"
      >
        <UIcon name="i-lucide-clock" />
        {{ formatDuration(trip.duration_minutes) }}
      </span>

      <span class="inline-flex items-center gap-1">
        <UIcon name="i-lucide-timer" />
        Espera {{ trip.wait_minutes }} min
      </span>

      <span class="inline-flex items-center gap-1">
        <UIcon :name="trip.booking_mode === 'instant' ? 'i-lucide-zap' : 'i-lucide-message-square-reply'" />
        {{ bookingModeLabel(trip.booking_mode) }}
      </span>
    </div>

    <USeparator class="my-3" />

    <div class="flex items-center gap-3">
      <UAvatar
        :src="trip.driver_avatar_url ?? undefined"
        :alt="trip.driver_name ?? ''"
        icon="i-lucide-user-round"
        size="md"
      />

      <div class="min-w-0 flex-1 text-sm">
        <p class="flex flex-wrap items-center gap-x-1.5 font-medium">
          {{ trip.driver_name }}
          <UIcon
            v-if="trip.driver_verified"
            name="i-lucide-badge-check"
            class="size-4 text-primary"
            aria-label="Condutor verificado"
          />
        </p>

        <p class="text-muted">
          <span class="inline-flex items-center gap-0.5">
            <UIcon
              name="i-lucide-star"
              class="size-3.5"
            />
            {{ ratingLabel(trip.driver_rating_avg, trip.driver_rating_count) }}
          </span>
          · {{ tripsCountLabel(trip.driver_trips_driven) }}
          <span v-if="!trip.driver_verified"> · Condutor não verificado</span>
        </p>
      </div>

      <UBadge
        :color="isFull ? 'neutral' : 'primary'"
        variant="subtle"
      >
        {{ seatsLabel(isFull ? 0 : trip.seats_available) }}
      </UBadge>
    </div>
  </NuxtLink>
</template>
