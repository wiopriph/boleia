<script setup lang="ts">
import type { PayoutMethod } from '~~/types/rpc';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'O meu perfil', robots: 'noindex' });

const route = useRoute();
const { profile, load } = useProfile();
const { load: loadVehicles } = useVehicles();

const isOnboarding = computed(() => route.query.onboarding === '1');
const redirectAfter = computed(() => {
  const redirect = route.query.redirect;

  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/';
});

const { pending: isPending } = await useAsyncData('conta-perfil', async () => {
  await Promise.all([load(true), loadVehicles()]);

  return true;
});

const payoutMethod = computed(() => (profile.value?.payout_method ?? null) as PayoutMethod | null);

function onSaved() {
  if (isOnboarding.value) {
    navigateTo(redirectAfter.value);
  }
}
</script>

<template>
  <UiPage>
    <div
      v-if="isOnboarding"
      class="measure-form mx-auto"
    >
      <h1 class="page-title">
        Complete o seu perfil
      </h1>

      <p class="mt-1 text-muted">
        Só falta o nome e uma fotografia para continuar.
      </p>

      <UCard class="mt-6">
        <ProfileForm
          v-if="profile"
          :profile="profile"
          isOnboarding
          @saved="onSaved"
        />

        <USkeleton
          v-else
          class="h-40 w-full"
        />
      </UCard>
    </div>

    <template v-else>
      <UiPageHeader
        title="O meu perfil"
        description="Os teus dados, veículos e preferências de levantamento."
      />

      <p
        v-if="profile?.phone"
        class="mt-1 text-muted"
      >
        {{ formatPhone(profile.phone) }}
      </p>

      <div
        v-if="isPending && !profile"
        class="mt-6 space-y-4"
      >
        <USkeleton class="h-56 w-full" />

        <USkeleton class="h-40 w-full" />
      </div>

      <div
        v-else-if="profile"
        class="mt-6 space-y-6"
      >
        <UCard>
          <template #header>
            <h2 class="card-title">
              Dados pessoais
            </h2>
          </template>

          <ProfileForm :profile="profile" />
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2 class="card-title">
                Os meus veículos
              </h2>

              <UBadge
                v-if="profile.driver_status === 'verified'"
                color="primary"
                variant="subtle"
                icon="i-lucide-badge-check"
              >
                Condutor verificado
              </UBadge>
            </div>
          </template>

          <ProfileVehicles />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="card-title">
              Método de levantamento
            </h2>

            <p class="mt-1 text-sm text-muted">
              Para onde enviamos o dinheiro das suas viagens. Obrigatório para publicar.
            </p>
          </template>

          <ProfilePayoutMethod :current="payoutMethod" />
        </UCard>

        <UCard>
          <template #header>
            <h2 class="card-title">
              Apagar conta
            </h2>
          </template>

          <ProfileDeleteAccount />
        </UCard>
      </div>
    </template>
  </UiPage>
</template>
