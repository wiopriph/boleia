<script setup lang="ts">
const route = useRoute();
const profileId = String(route.params.id ?? '');
const user = useSupabaseUser();
const userId = useUserId();
const { fetchProfile, fetchReviews, fetchUpcomingTrips } = usePublicProfile();

const REVIEWS_PREVIEW = 3;
const requestEvent = useRequestEvent();

const { data } = await useAsyncData(`public-profile:${profileId}`, async () => {
  const profile = await fetchProfile(profileId);

  if (!profile) {
    return null;
  }

  const [reviews, trips] = await Promise.all([
    fetchReviews(profileId, { limit: REVIEWS_PREVIEW }),
    fetchUpcomingTrips(profileId),
  ]);

  return { profile, reviews, trips };
});

if (import.meta.server && !data.value && requestEvent) {
  setResponseStatus(requestEvent, 404);
}

const profile = computed(() => data.value?.profile ?? null);
const reviews = computed(() => data.value?.reviews ?? []);
const trips = computed(() => data.value?.trips ?? []);

const isOwnProfile = computed(() => !!userId.value && userId.value === profileId);
const cancelBadge = computed(() => cancelBadgeLabel(profile.value?.cancel_badge ?? null));
const ageGroup = computed(() => ageGroupLabel(profile.value?.birth_year ?? null));
const isReportOpen = ref(false);

function openReport() {
  if (!user.value) {
    navigateTo({ path: '/entrar', query: { redirect: route.fullPath } });

    return;
  }

  isReportOpen.value = true;
}

useSeoMeta({
  title: () => (profile.value ? `${profile.value.display_name}, perfil` : 'Perfil'),
  robots: 'noindex',
});
</script>

<template>
  <UContainer class="max-w-2xl py-8">
    <div
      v-if="!profile"
      class="flex flex-col items-center gap-4 py-12 text-center"
    >
      <UIcon
        name="i-lucide-user-round-x"
        class="size-10 text-muted"
      />

      <h1 class="text-xl font-semibold">
        Perfil não encontrado
      </h1>

      <UButton
        to="/"
        variant="soft"
      >
        Voltar ao início
      </UButton>
    </div>

    <template v-else>
      <div class="flex items-center gap-4">
        <UAvatar
          :src="profile.avatar_url ?? undefined"
          :alt="profile.display_name ?? ''"
          icon="i-lucide-user-round"
          class="size-20 text-2xl"
        />

        <div class="min-w-0 flex-1">
          <h1 class="flex flex-wrap items-center gap-2 text-2xl font-semibold">
            {{ profile.display_name }}
            <UBadge
              v-if="profile.driver_verified"
              color="primary"
              variant="subtle"
              icon="i-lucide-badge-check"
            >
              Condutor verificado
            </UBadge>
          </h1>

          <p class="text-sm text-muted">
            Membro desde {{ formatMonthYear(profile.member_since ?? '') }}<template v-if="ageGroup">
              · {{ ageGroup }}
            </template>
          </p>
        </div>
      </div>

      <p
        v-if="profile.bio"
        class="mt-4 whitespace-pre-wrap"
      >
        {{ profile.bio }}
      </p>

      <UCard class="mt-5">
        <dl class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt class="text-muted">
              Avaliação
            </dt>

            <dd class="font-medium">
              <UIcon
                name="i-lucide-star"
                class="size-3.5 align-text-bottom"
              />
              {{ ratingLabel(profile.rating_avg, profile.rating_count) }}
            </dd>
          </div>

          <div>
            <dt class="text-muted">
              Como condutor
            </dt>

            <dd class="font-medium">
              {{ tripsCountLabel(profile.trips_driven) }}
            </dd>
          </div>

          <div>
            <dt class="text-muted">
              Como passageiro
            </dt>

            <dd class="font-medium">
              {{ tripsCountLabel(profile.trips_ridden) }}
            </dd>
          </div>

          <div>
            <dt class="text-muted">
              Cancelamentos
            </dt>

            <dd class="font-medium">
              {{ cancelBadge ?? 'Sem histórico' }}
            </dd>
          </div>
        </dl>

        <ul class="mt-4 space-y-1.5 text-sm">
          <li class="flex items-center gap-2">
            <UIcon
              name="i-lucide-phone"
              class="size-4 text-success"
            />
            Número de telemóvel confirmado
          </li>

          <li class="flex items-center gap-2">
            <UIcon
              :name="profile.driver_verified ? 'i-lucide-badge-check' : 'i-lucide-badge'"
              class="size-4"
              :class="profile.driver_verified ? 'text-success' : 'text-muted'"
            />
            {{ profile.driver_verified ? 'Documento, carta de condução e veículo verificados' : 'Documentos de condutor ainda não verificados' }}
          </li>
        </ul>
      </UCard>

      <UCard class="mt-4">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">
              Avaliações
            </h2>

            <UButton
              v-if="(profile.rating_count ?? 0) > REVIEWS_PREVIEW"
              :to="`/perfil/${profile.id}/avaliacoes`"
              variant="link"
              color="neutral"
              trailingIcon="i-lucide-chevron-right"
            >
              Ver todas ({{ profile.rating_count }})
            </UButton>
          </div>
        </template>

        <ul
          v-if="reviews.length"
          class="divide-y divide-default"
        >
          <ReviewItem
            v-for="review in reviews"
            :key="review.id ?? ''"
            :review="review"
          />
        </ul>

        <p
          v-else
          class="text-sm text-muted"
        >
          Ainda não tem avaliações públicas. Uma avaliação fica visível quando as duas pessoas avaliam ou 14 dias depois da viagem.
        </p>
      </UCard>

      <section
        v-if="trips.length"
        class="mt-6"
      >
        <h2 class="mb-3 font-semibold">
          Próximas viagens
        </h2>

        <div class="space-y-3">
          <TripCard
            v-for="trip in trips"
            :key="trip.id ?? ''"
            :trip="trip"
          />
        </div>
      </section>

      <div class="mt-6 flex justify-center">
        <UButton
          v-if="isOwnProfile"
          to="/conta/perfil"
          variant="soft"
          color="neutral"
          icon="i-lucide-pencil"
        >
          Editar o meu perfil
        </UButton>

        <UButton
          v-else
          variant="ghost"
          color="neutral"
          icon="i-lucide-flag"
          @click="openReport"
        >
          Denunciar
        </UButton>
      </div>

      <ProfileReportModal
        v-model:open="isReportOpen"
        :targetId="profile.id ?? ''"
        :targetName="profile.display_name ?? ''"
      />
    </template>
  </UContainer>
</template>
