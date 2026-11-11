<script setup lang="ts">
import type { AdminProfile } from '~/composables/useAdmin';


defineProps<{ profile: AdminProfile | null, role?: string }>();
</script>

<template>
  <div class="flex items-center gap-3">
    <UAvatar
      :src="profile?.avatar_url ?? undefined"
      :alt="profile?.display_name ?? 'Utilizador'"
      size="md"
    />

    <div class="min-w-0 text-sm">
      <p
        v-if="role"
        class="text-xs text-muted"
      >
        {{ role }}
      </p>

      <template v-if="profile">
        <NuxtLink
          :to="`/admin/utilizadores/${profile.id}`"
          class="font-medium hover:text-primary"
        >
          {{ profile.display_name }}
        </NuxtLink>

        <p class="truncate text-muted">
          {{ formatPhone(profile.phone) || 'sem telefone' }}
          · conta {{ profileStatusLabel(profile.status, profile.suspended_until).toLowerCase() }}
        </p>

        <p class="truncate text-xs text-muted">
          {{ ratingLabel(profile.rating_avg, profile.rating_count) }}
          · {{ profile.cancels_total }} cancelamentos · {{ profile.no_shows }} faltas
        </p>
      </template>

      <p
        v-else
        class="text-muted"
      >
        Conta apagada ou desconhecida
      </p>
    </div>
  </div>
</template>
