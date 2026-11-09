<script setup lang="ts">
// Rendered by nuxt-og-image through satori: flex layout only, fixed spacing instead of stretching,
// inline colors. Keep the stacked height well under 600px.
defineProps<{
  origin: string
  destination: string
  day: string
  time: string
  price: string
  seats: string
  driver: string
}>();
</script>

<template>
  <div
    class="flex flex-col p-12"
    style="width: 1200px; height: 600px; background: #0f172a; color: #f8fafc; font-family: Inter;"
  >
    <div class="flex items-center justify-between">
      <span
        class="text-3xl font-bold"
        style="color: #34d399;"
      >Boleia</span>

      <span
        class="text-2xl"
        style="color: #94a3b8;"
      >{{ day }}, {{ time }}</span>
    </div>

    <div class="mt-12 flex flex-col">
      <span
        class="text-6xl font-bold"
        style="line-height: 1.1;"
      >{{ origin }}</span>

      <span
        class="text-3xl"
        style="color: #94a3b8; line-height: 1.3;"
      >para</span>

      <span
        class="text-6xl font-bold"
        style="line-height: 1.1;"
      >{{ destination }}</span>
    </div>

    <div class="mt-12 flex items-end justify-between">
      <div class="flex flex-col">
        <span
          class="text-5xl font-bold"
          style="color: #34d399; line-height: 1.1;"
        >{{ price }}</span>

        <span
          class="text-2xl"
          style="color: #94a3b8;"
        >por lugar · {{ seats }}</span>
      </div>

      <span
        class="text-2xl"
        style="color: #cbd5e1;"
      >Condutor: {{ driver }}</span>
    </div>
  </div>
</template>
