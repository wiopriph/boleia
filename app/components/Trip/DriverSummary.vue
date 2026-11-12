<script setup lang="ts">
import type { TripPublic } from '~/composables/useTrip';


defineProps<{ trip: TripPublic }>();
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <UAvatar
      :src="trip.driver_avatar_url ?? undefined"
      :alt="trip.driver_name ?? ''"
      icon="i-lucide-user-round"
      size="lg"
      class="shrink-0"
    />

    <div class="min-w-0">
      <p class="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
        {{ trip.driver_name }}
        <UIcon
          v-if="trip.driver_verified"
          name="i-lucide-badge-check"
          class="size-4 shrink-0 text-primary"
          aria-label="Condutor verificado"
        />
      </p>

      <p class="mt-1 text-xs leading-relaxed text-muted">
        <UIcon
          name="i-lucide-star"
          class="size-3.5 align-text-bottom text-warning"
        />
        {{ ratingLabel(trip.driver_rating_avg, trip.driver_rating_count) }} · {{ tripsCountLabel(trip.driver_trips_driven) }}
        <span v-if="!trip.driver_verified"> · Condutor não verificado</span>
      </p>
    </div>
  </div>
</template>
