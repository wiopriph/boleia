<script setup lang="ts">
const links = [
  { label: 'Regras', to: '/regras' },
  { label: 'Segurança', to: '/seguranca' },
  { label: 'Pagamentos e reembolsos', to: '/pagamentos-e-reembolsos' },
  { label: 'Perguntas frequentes', to: '/faq' },
  { label: 'Contactos', to: '/contactos' },
];
</script>

<template>
  <footer class="border-t border-default py-6 text-sm text-muted">
    <UContainer class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav class="flex flex-wrap gap-x-4 gap-y-2">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="hover:text-default"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <p>
        Boleia, {{ new Date().getFullYear() }}
      </p>
    </UContainer>
  </footer>
</template>
