<script setup lang="ts">
// Main column plus a side column for context; on phones the side column follows the content
// unless it has to be read first.
withDefaults(defineProps<{ isAsideFirstOnPhone?: boolean }>(), { isAsideFirstOnPhone: false });
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
    <div class="min-w-0 space-y-6">
      <slot />
    </div>

    <aside
      class="min-w-0 space-y-4 lg:sticky lg:top-26"
      :class="isAsideFirstOnPhone ? 'order-first lg:order-none' : ''"
    >
      <slot name="aside" />
    </aside>
  </div>
</template>
