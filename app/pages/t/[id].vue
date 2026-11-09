<script setup lang="ts">
// public share link: same page, canonical points at /viagem/<id>
const { trip } = await useTripPage(current => `/viagem/${current.id}`);
</script>

<template>
  <TripDetail
    v-if="trip"
    :trip="trip"
  />

  <TripUnavailable v-else />
</template>
