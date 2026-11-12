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
  <header class="sticky top-0 z-40 border-b border-default bg-default">
    <UContainer class="flex h-18 items-center justify-between gap-3">
      <AppLogo />

      <nav
        aria-label="Navegação principal"
        class="hidden items-center gap-1 md:flex"
      >
        <UButton
          to="/pesquisa"
          color="neutral"
          variant="ghost"
          icon="i-lucide-search"
        >
          Encontrar boleia
        </UButton>

        <UButton
          to="/publicar"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
        >
          Oferecer boleia
        </UButton>

        <UButton
          to="/faq"
          color="neutral"
          variant="ghost"
        >
          Como funciona
        </UButton>
      </nav>

      <div class="flex items-center gap-1 sm:gap-2">
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
            variant="soft"
            icon="i-lucide-user-round"
            aria-label="A minha conta"
            trailingIcon="i-lucide-chevron-down"
          >
            <span class="hidden sm:inline">A minha conta</span>
          </UButton>
        </UDropdownMenu>

        <UButton
          v-else
          to="/entrar"
          variant="solid"
        >
          Entrar
        </UButton>

        <UDropdownMenu
          :items="[
            { label: 'Encontrar boleia', icon: 'i-lucide-search', to: '/pesquisa' },
            { label: 'Oferecer boleia', icon: 'i-lucide-plus', to: '/publicar' },
            { label: 'Como funciona', icon: 'i-lucide-circle-help', to: '/faq' },
          ]"
          :content="{ align: 'end' }"
        >
          <UButton
            class="md:hidden"
            variant="ghost"
            color="neutral"
            icon="i-lucide-menu"
            aria-label="Abrir menu de navegação"
          />
        </UDropdownMenu>
      </div>
    </UContainer>
  </header>
</template>
