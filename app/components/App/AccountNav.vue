<script setup lang="ts">
import type { SectionLink } from '~/components/Ui/SectionShell.vue';


const links: SectionLink[] = [
  { label: 'As minhas reservas', icon: 'i-lucide-ticket', to: '/conta/reservas', also: ['/avaliar/'] },
  { label: 'As minhas viagens', icon: 'i-lucide-car-front', to: '/conta/viagens', also: ['/publicar'] },
  { label: 'Mensagens', icon: 'i-lucide-message-circle', to: '/conta/mensagens' },
  { label: 'Carteira', icon: 'i-lucide-wallet', to: '/conta/carteira' },
  { label: 'O meu perfil', icon: 'i-lucide-user-round', to: '/conta/perfil' },
  { label: 'Verificação', icon: 'i-lucide-shield-check', to: '/conta/condutor' },
  { label: 'Notificações', icon: 'i-lucide-bell', to: '/conta/notificacoes' },
];
</script>

<template>
  <UiSectionShell
    title="A minha conta"
    :links="links"
  >
    <template #note>
      <NuxtLink
        to="/seguranca"
        class="flex gap-2 text-sm leading-relaxed text-muted hover:text-primary"
      >
        <UIcon
          name="i-lucide-shield-check"
          class="mt-0.5 size-5 shrink-0 text-primary"
        />

        Viaja com confiança.<br>Conhece as nossas recomendações.
      </NuxtLink>
    </template>

    <slot />
  </UiSectionShell>
</template>
