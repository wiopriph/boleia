<script setup lang="ts">
definePageMeta({ middleware: 'admin' });
useSeoMeta({ title: 'Administração', robots: 'noindex' });

const route = useRoute();
const { data: stats } = await useAdminStats();

const links = computed(() => [
  { label: 'Resumo', to: '/admin', count: null },
  { label: 'Verificações', to: '/admin/verificacoes', count: stats.value?.queues.verifications ?? null },
  { label: 'Denúncias', to: '/admin/denuncias', count: stats.value?.queues.reports_open ?? null },
  { label: 'Disputas', to: '/admin/disputas', count: stats.value?.queues.disputes ?? null },
  { label: 'Levantamentos', to: '/admin/levantamentos', count: stats.value?.queues.payouts ?? null },
  { label: 'Utilizadores', to: '/admin/utilizadores', count: null },
  { label: 'Dinheiro', to: '/admin/dinheiro', count: stats.value?.queues.refunds_manual ?? null },
  { label: 'Semanas', to: '/admin/semanas', count: null },
  { label: 'Locais', to: '/admin/locais', count: null },
]);

function isActive(path: string) {
  return path === '/admin' ? route.path === '/admin' : route.path.startsWith(path);
}
</script>

<template>
  <UContainer class="max-w-4xl py-6">
    <nav
      aria-label="Administração"
      class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
    >
      <UButton
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :variant="isActive(link.to) ? 'soft' : 'ghost'"
        :color="isActive(link.to) ? 'primary' : 'neutral'"
        class="shrink-0"
      >
        {{ link.label }}

        <UBadge
          v-if="link.count"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ link.count }}
        </UBadge>
      </UButton>
    </nav>

    <div class="mt-4">
      <NuxtPage />
    </div>
  </UContainer>
</template>
