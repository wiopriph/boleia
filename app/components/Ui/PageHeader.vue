<script setup lang="ts">
defineProps<{ title: string, description?: string, eyebrow?: string }>();
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <p
        v-if="eyebrow"
        class="eyebrow mb-3"
      >
        {{ eyebrow }}
      </p>

      <h1 class="page-title">
        {{ title }}
      </h1>

      <p
        v-if="description"
        class="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base"
      >
        {{ description }}
      </p>
    </div>

    <slot />
  </div>
</template>
