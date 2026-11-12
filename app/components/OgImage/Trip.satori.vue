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
    class="flex flex-col"
    style="width: 1200px; height: 600px; padding: 56px 72px; background: #ffffff; color: #192b29; font-family: Inter;"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <span
          class="font-bold"
          style="font-size: 44px; letter-spacing: -2px; color: #087f70;"
        >boleia</span>

        <span
          class="font-bold"
          style="font-size: 44px; color: #f4b544;"
        >.</span>
      </div>

      <span style="font-size: 28px; color: #60736b;">{{ day }}, {{ time }}</span>
    </div>

    <div
      class="flex flex-col"
      style="margin-top: 44px;"
    >
      <span
        class="font-bold"
        style="font-size: 76px; line-height: 1.1; letter-spacing: -2px;"
      >{{ origin }}</span>

      <span style="font-size: 32px; line-height: 1.4; color: #60736b;">para</span>

      <span
        class="font-bold"
        style="font-size: 76px; line-height: 1.1; letter-spacing: -2px;"
      >{{ destination }}</span>
    </div>

    <div
      class="flex items-end justify-between"
      style="margin-top: 44px;"
    >
      <div class="flex flex-col">
        <span
          class="font-bold"
          style="font-size: 56px; line-height: 1.1; color: #087f70;"
        >{{ price }}</span>

        <span style="font-size: 26px; color: #60736b;">por lugar · {{ seats }}</span>
      </div>

      <span style="font-size: 26px; color: #3b5148;">Condutor: {{ driver }}</span>
    </div>

    <div
      class="flex"
      style="position: absolute; left: 0; bottom: 0; width: 1200px; height: 12px; background: #087f70;"
    />
  </div>
</template>
