<script setup lang="ts">
// The one page frame: every screen gets the same container, gutters and vertical rhythm.
// Inside UiSectionShell the container already exists, so only the rhythm is added.
const isInShell = inject(PAGE_SHELL_KEY, false);
</script>

<template>
  <div
    v-if="isInShell"
    class="py-8 sm:py-10"
  >
    <slot />
  </div>

  <UContainer
    v-else
    class="py-8 sm:py-10"
  >
    <slot />
  </UContainer>
</template>
