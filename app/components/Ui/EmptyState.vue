<script setup lang="ts">
defineProps<{ icon: string, title: string, description?: string }>();
</script>

<template>
  <div class="flex flex-col items-center rounded-card border border-dashed border-default bg-default px-5 py-12 text-center">
    <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-elevated">
      <UIcon
        :name="icon"
        class="size-6 text-primary"
      />
    </div>

    <h2 class="card-title">
      {{ title }}
    </h2>

    <p
      v-if="description"
      class="mt-2 max-w-md text-sm leading-relaxed text-muted"
    >
      {{ description }}
    </p>

    <div
      v-if="$slots.default"
      class="mt-5 flex flex-wrap justify-center gap-2"
    >
      <slot />
    </div>
  </div>
</template>
