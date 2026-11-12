<script setup lang="ts">
import type { AdminUser } from '~~/types/rpc';


useSeoMeta({ title: 'Utilizadores', robots: 'noindex' });

const route = useRoute();
const { searchUsers } = useAdmin();

const query = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''));
const input = ref(query.value);

const { data: users, error, status } = await useAsyncData(
  () => `admin-users:${query.value}`,
  () => (query.value ? searchUsers(query.value) : Promise.resolve([] as AdminUser[])),
  { watch: [query], default: () => [] as AdminUser[] },
);

function submit() {
  return navigateTo({ path: '/admin/utilizadores', query: input.value.trim() ? { q: input.value.trim() } : {} });
}
</script>

<template>
  <div>
    <h1 class="page-title">
      Utilizadores
    </h1>

    <form
      class="mt-4 flex gap-2"
      @submit.prevent="submit"
    >
      <UInput
        v-model="input"
        icon="i-lucide-search"
        placeholder="Telefone, nome ou identificador"
        size="lg"
        class="flex-1"
        aria-label="Pesquisar utilizadores"
      />

      <UButton
        type="submit"
        size="lg"
        :loading="status === 'pending'"
      >
        Pesquisar
      </UButton>
    </form>

    <p class="mt-2 text-sm text-muted">
      Telefone com pelo menos 6 algarismos, parte do nome ou o identificador completo.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível pesquisar"
    />

    <p
      v-else-if="query && !users.length && status !== 'pending'"
      class="mt-6 text-center text-muted"
    >
      Nenhum utilizador encontrado para "{{ query }}".
    </p>

    <ul
      v-else-if="users.length"
      class="mt-5 divide-y divide-default rounded-xl border border-default"
    >
      <li
        v-for="user in users"
        :key="user.id"
      >
        <NuxtLink
          :to="`/admin/utilizadores/${user.id}`"
          class="flex items-center gap-3 p-3 transition-colors hover:bg-elevated/50"
        >
          <UAvatar
            :src="user.avatar_url ?? undefined"
            :alt="user.display_name"
            size="lg"
          />

          <div class="min-w-0 flex-1 text-sm">
            <p class="font-medium">
              {{ user.display_name }}
              <span
                v-if="user.is_admin"
                class="font-normal text-muted"
              >· administrador</span>
            </p>

            <p class="truncate text-muted">
              {{ formatPhone(user.phone) || 'sem telefone' }}
              · conta {{ profileStatusLabel(user.status, user.suspended_until).toLowerCase() }}
            </p>

            <p class="truncate text-xs text-muted">
              {{ driverStatusLabel(user.driver_status) }}
              · {{ tripsCountLabel(user.trips_driven) }} como condutor · {{ user.trips_ridden }} como passageiro
            </p>
          </div>

          <UIcon
            name="i-lucide-chevron-right"
            class="size-5 shrink-0 text-muted"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
