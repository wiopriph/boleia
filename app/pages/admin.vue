<script setup lang="ts">
import type { SectionLink } from '~/components/Ui/SectionShell.vue';


definePageMeta({ middleware: 'admin' });
useSeoMeta({ title: 'Administração', robots: 'noindex' });

const { data: stats } = await useAdminStats();

const links = computed<SectionLink[]>(() => [
  { label: 'Resumo', icon: 'i-lucide-layout-dashboard', to: '/admin', isExact: true },
  { label: 'Verificações', icon: 'i-lucide-badge-check', to: '/admin/verificacoes', count: stats.value?.queues.verifications },
  { label: 'Denúncias', icon: 'i-lucide-flag', to: '/admin/denuncias', count: stats.value?.queues.reports_open },
  { label: 'Disputas', icon: 'i-lucide-scale', to: '/admin/disputas', count: stats.value?.queues.disputes },
  { label: 'Levantamentos', icon: 'i-lucide-banknote', to: '/admin/levantamentos', count: stats.value?.queues.payouts },
  { label: 'Utilizadores', icon: 'i-lucide-users', to: '/admin/utilizadores' },
  { label: 'Dinheiro', icon: 'i-lucide-landmark', to: '/admin/dinheiro', count: stats.value?.queues.refunds_manual },
  { label: 'Semanas', icon: 'i-lucide-chart-column', to: '/admin/semanas' },
  { label: 'Locais', icon: 'i-lucide-map-pin', to: '/admin/locais' },
]);
</script>

<template>
  <UiSectionShell
    title="Administração"
    :links="links"
  >
    <UiPage>
      <NuxtPage />
    </UiPage>
  </UiSectionShell>
</template>
