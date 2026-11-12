<script setup lang="ts">
import type { TripRow } from '~/composables/useSearch';


const props = defineProps<{ trip: TripRow }>();

const arrival = computed(() => arrivalAt(props.trip.departure_at, props.trip.duration_minutes));
const isFull = computed(() => props.trip.status === 'full' || props.trip.seats_available <= 0);
</script>

<template>
  <NuxtLink
    :to="`/viagem/${trip.id}`"
    class="surface-link group"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="grid min-w-0 grid-cols-[auto_1fr] gap-x-4 gap-y-4 text-sm">
        <span class="text-lg font-semibold tabular-nums leading-6">{{ formatTime(trip.departure_at) }}</span>

        <div class="relative border-s-2 border-primary/20 ps-4">
          <span class="absolute -start-[5px] top-2 size-2 rounded-full bg-primary" />

          <p class="font-semibold leading-6">
            {{ trip.origin_name }}
          </p>

          <p
            v-if="trip.origin_detail"
            class="mt-0.5 text-xs leading-relaxed text-muted"
          >
            {{ trip.origin_detail }}
          </p>
        </div>

        <span class="font-medium tabular-nums text-muted">{{ arrival ? formatTime(arrival) : '—' }}</span>

        <div class="relative ps-4">
          <span class="absolute -start-[3px] top-1.5 size-2 rounded-full border-2 border-primary bg-default" />

          <p class="font-medium">
            {{ trip.destination_name }}
          </p>

          <p
            v-if="trip.destination_detail"
            class="mt-0.5 text-xs leading-relaxed text-muted"
          >
            {{ trip.destination_detail }}
          </p>
        </div>
      </div>

      <div class="shrink-0 text-right">
        <p class="text-xl font-semibold tracking-tight tabular-nums">
          {{ formatKz(trip.price_per_seat_kz) }}
        </p>

        <p class="mt-1 text-xs text-muted">
          por lugar
        </p>

        <p
          class="mt-3 inline-flex items-center gap-1 text-xs"
          :class="isFull ? 'text-muted' : 'text-primary'"
        >
          <UIcon
            name="i-lucide-armchair"
            class="size-4"
          />{{ seatsLabel(isFull ? 0 : trip.seats_available) }}
        </p>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
      <span
        v-if="trip.duration_minutes"
        class="inline-flex items-center gap-1.5"
      ><UIcon
        name="i-lucide-clock"
        class="size-3.5"
      />{{ formatDuration(trip.duration_minutes) }}</span>

      <span class="inline-flex items-center gap-1.5"><UIcon
        name="i-lucide-timer"
        class="size-3.5"
      />Espera {{ trip.wait_minutes }} min</span>

      <span class="inline-flex items-center gap-1.5"><UIcon
        :name="trip.booking_mode === 'instant' ? 'i-lucide-zap' : 'i-lucide-message-square-reply'"
        class="size-3.5"
      />{{ bookingModeLabel(trip.booking_mode) }}</span>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 border-t border-default pt-4">
      <TripDriverSummary :trip="trip" />

      <span class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
        <span class="hidden sm:inline">Ver viagem</span>

        <UIcon
          name="i-lucide-arrow-right"
          class="size-5 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </div>
  </NuxtLink>
</template>
