<script setup lang="ts">
const route = useRoute();
// signed-in flows share the account frame; onboarding keeps its focused presentation
const ACCOUNT_PREFIXES = ['/conta/', '/publicar', '/avaliar/'];
const isAccount = computed(() => ACCOUNT_PREFIXES.some(prefix => route.path.startsWith(prefix)) && route.query.onboarding !== '1');
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main-content"
      class="sr-only z-50 rounded-lg bg-default p-4 text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >Saltar para o conteúdo</a>

    <AppHeader />

    <main
      id="main-content"
      class="min-w-0 flex-1"
      tabindex="-1"
    >
      <AppAccountNav v-if="isAccount">
        <slot />
      </AppAccountNav>

      <slot v-else />
    </main>

    <AppFooter />
  </div>
</template>
