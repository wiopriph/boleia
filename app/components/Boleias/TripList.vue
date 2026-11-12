<script setup lang="ts">
import type { TripRow } from '~/composables/useSearch';


const props = defineProps<{ trips: TripRow[] }>();

const groups = computed(() => groupTripsByDay(props.trips));
</script>

<template>
  <div class="space-y-6">
    <section
      v-for="group in groups"
      :key="group.day"
    >
      <h3 class="group-label mb-3">
        {{ formatDayLong(group.day) }}
      </h3>

      <div class="space-y-3">
        <TripCard
          v-for="trip in group.items"
          :key="trip.id"
          :trip="trip"
        />
      </div>
    </section>
  </div>
</template>
