<script setup lang="ts">
import type { PublicReview } from '~/composables/usePublicProfile';


const route = useRoute();
const profileId = String(route.params.id ?? '');
const { fetchProfile, fetchReviews, reviewsPageSize } = usePublicProfile();

const { data: profile } = await useAsyncData(`public-profile-head:${profileId}`, () => fetchProfile(profileId));
const { data: firstPage } = await useAsyncData(
  `public-reviews:${profileId}`,
  () => fetchReviews(profileId),
  { default: () => [] as PublicReview[] },
);

const olderReviews = ref<PublicReview[]>([]);
const hasMore = ref(firstPage.value.length === reviewsPageSize);
const isLoadingMore = ref(false);
const reviews = computed(() => [...firstPage.value, ...olderReviews.value]);

async function loadMore() {
  const last = reviews.value.at(-1);

  if (!last?.created_at || isLoadingMore.value) {
    return;
  }

  isLoadingMore.value = true;

  try {
    const page = await fetchReviews(profileId, { before: last.created_at });

    olderReviews.value = [...olderReviews.value, ...page];
    hasMore.value = page.length === reviewsPageSize;
  } finally {
    isLoadingMore.value = false;
  }
}

useSeoMeta({
  title: () => (profile.value ? `Avaliações de ${profile.value.display_name}` : 'Avaliações'),
  robots: 'noindex',
});
</script>

<template>
  <UContainer class="max-w-2xl py-8">
    <UButton
      :to="`/perfil/${profileId}`"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="-ms-2"
    >
      {{ profile?.display_name ?? 'Perfil' }}
    </UButton>

    <h1 class="mt-2 text-2xl font-semibold">
      Avaliações
    </h1>

    <p
      v-if="profile"
      class="mt-1 text-muted"
    >
      <UIcon
        name="i-lucide-star"
        class="size-4 align-text-bottom"
      />
      {{ ratingLabel(profile.rating_avg, profile.rating_count) }}
    </p>

    <ul
      v-if="reviews.length"
      class="mt-4 divide-y divide-default"
    >
      <ReviewItem
        v-for="review in reviews"
        :key="review.id ?? ''"
        :review="review"
      />
    </ul>

    <p
      v-else
      class="mt-8 text-center text-muted"
    >
      Ainda não há avaliações públicas.
    </p>

    <div
      v-if="hasMore"
      class="mt-4 flex justify-center"
    >
      <UButton
        variant="soft"
        color="neutral"
        :loading="isLoadingMore"
        @click="loadMore"
      >
        Mostrar mais
      </UButton>
    </div>
  </UContainer>
</template>
