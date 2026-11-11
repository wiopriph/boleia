<script setup lang="ts">
import type { PublicReview } from '~/composables/usePublicProfile';


defineProps<{ review: PublicReview }>();
</script>

<template>
  <li class="py-4">
    <div class="flex items-center gap-3">
      <UAvatar
        :src="review.author_avatar_url ?? undefined"
        :alt="review.author_name ?? ''"
        icon="i-lucide-user-round"
        size="sm"
      />

      <div class="min-w-0 flex-1">
        <NuxtLink
          :to="`/perfil/${review.author_id}`"
          class="font-medium hover:underline"
        >
          {{ review.author_name }}
        </NuxtLink>

        <p class="text-xs text-muted">
          {{ review.direction === 'passenger_to_driver' ? 'Viajou como passageiro' : 'Foi o condutor' }} · {{ formatMonthYear(review.created_at ?? '') }}
        </p>
      </div>

      <div class="shrink-0 text-right">
        <ReviewStars :rating="review.rating ?? 0" />
      </div>
    </div>

    <p
      v-if="review.comment"
      class="mt-2 whitespace-pre-wrap text-sm"
    >
      {{ review.comment }}
    </p>

    <div
      v-if="review.tags?.length"
      class="mt-2 flex flex-wrap gap-1.5"
    >
      <UBadge
        v-for="tag in review.tags"
        :key="tag"
        color="neutral"
        variant="subtle"
      >
        {{ reviewTagLabel(tag) }}
      </UBadge>
    </div>
  </li>
</template>
