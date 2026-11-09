<script setup lang="ts">
const { trip } = await useTripPage(current => `/viagem/${current.id}`);
</script>

<template>
  <TripDetail
    v-if="trip"
    :trip="trip"
  />

  <TripUnavailable v-else />
</template>
