<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <div class="rounded-xl border border-dashed border-default p-8 text-center">
    <UIcon
      name="i-lucide-check-check"
      class="size-8 text-muted"
    />

    <p class="mt-2 font-medium">
      {{ title }}
    </p>
  </div>
</template>
