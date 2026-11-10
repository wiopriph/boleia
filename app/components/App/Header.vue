<script setup lang="ts">
const { user, signOut } = useAuth();
const { isAdmin } = useProfile();
const { unreadCount, refreshUnread } = useNotifications();
const route = useRoute();

// pull, not realtime: the badge refreshes on sign-in and on every navigation
watch([user, () => route.fullPath], () => {
  if (import.meta.client) {
    refreshUnread();
  }
}, { immediate: true });

const menu = computed(() => [
  [
    { label: 'As minhas reservas', icon: 'i-lucide-ticket', to: '/conta/reservas' },
    { label: 'As minhas viagens', icon: 'i-lucide-car', to: '/conta/viagens' },
    { label: 'Mensagens', icon: 'i-lucide-message-circle', to: '/conta/mensagens' },
    { label: 'Carteira', icon: 'i-lucide-wallet', to: '/conta/carteira' },
    { label: 'Perfil', icon: 'i-lucide-user', to: '/conta/perfil' },
  ],
  ...(isAdmin.value ? [[{ label: 'Administração', icon: 'i-lucide-shield', to: '/admin' }]] : []),
  [{ label: 'Sair', icon: 'i-lucide-log-out', onSelect: () => signOut() }],
]);
</script>

<template>
  <header class="border-b border-default bg-default">
    <UContainer class="flex h-14 items-center justify-between gap-4">
      <NuxtLink
        to="/"
        class="text-lg font-semibold tracking-tight text-primary"
      >
        Boleia
      </NuxtLink>

      <nav class="flex items-center gap-2">
        <UButton
          to="/publicar"
          variant="ghost"
          color="neutral"
          icon="i-lucide-plus"
        >
          <span class="hidden sm:inline">Publicar viagem</span>
        </UButton>

        <UChip
          v-if="user"
          :show="unreadCount > 0"
          :text="unreadCount > 9 ? '9+' : String(unreadCount)"
          size="2xl"
          inset
        >
          <UButton
            to="/conta/notificacoes"
            variant="ghost"
            color="neutral"
            icon="i-lucide-bell"
            :aria-label="unreadCount ? `Notificações, ${unreadCount} por ler` : 'Notificações'"
          />
        </UChip>

        <UDropdownMenu
          v-if="user"
          :items="menu"
        >
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-lucide-user-round"
            aria-label="A minha conta"
          >
            <span class="hidden sm:inline">Conta</span>
          </UButton>
        </UDropdownMenu>

        <UButton
          v-else
          to="/entrar"
          variant="soft"
        >
          Entrar
        </UButton>
      </nav>
    </UContainer>
  </header>
</template>
