<script setup lang="ts">
import type { PayoutMethod, VerificationDocs } from '~~/types/rpc';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Verificação de condutor', robots: 'noindex' });

const { profile, load: loadProfile } = useProfile();
const { vehicles, load: loadVehicles } = useVehicles();
const { fetchLatest, submit } = useDriverVerification();
const { messageFor } = useBoleiaError();
const toast = useToast();

const { data: verification, refresh: refreshVerification } = await useAsyncData('driver-verification', async () => {
  const [, , latest] = await Promise.all([loadProfile(true), loadVehicles(), fetchLatest()]);

  return latest;
});

const driverStatus = computed(() => profile.value?.driver_status ?? 'none');
const isVerified = computed(() => driverStatus.value === 'verified');
const isPending = computed(() => verification.value?.status === 'pending');
const isRejected = computed(() => !isPending.value && !isVerified.value && verification.value?.status === 'rejected');
const canApply = computed(() => !isVerified.value && !isPending.value);

// submit_verification refuses a new request for 24 h after a rejection (RATE_LIMITED)
const RETRY_AFTER_MS = 24 * 60 * 60 * 1000;
const retryAt = computed(() => {
  const reviewedAt = isRejected.value ? verification.value?.reviewed_at : null;

  return reviewedAt ? new Date(new Date(reviewedAt).getTime() + RETRY_AFTER_MS) : null;
});
const mustWaitToRetry = computed(() => !!retryAt.value && retryAt.value.getTime() > Date.now());

const payoutMethod = computed(() => (profile.value?.payout_method ?? null) as PayoutMethod | null);
const payoutSummary = computed(() => {
  const method = payoutMethod.value;

  if (!method) {
    return null;
  }

  return method.type === 'mcx_express' ? `Multicaixa Express, ${formatPhone(method.phone)}` : `IBAN ${method.iban}, ${method.bank}`;
});

const vehicleId = ref<string | undefined>(undefined);

watch(vehicles, (list) => {
  if (!vehicleId.value || !list.some(item => item.id === vehicleId.value)) {
    vehicleId.value = list[0]?.id;
  }
}, { immediate: true });

const vehicleItems = computed(() => vehicles.value.map(item => ({
  label: [`${item.make} ${item.model}`, item.color, item.plate].filter(Boolean).join(' · '),
  value: item.id,
})));
const isVehicleFormOpen = ref(false);

const docs = reactive<Record<keyof VerificationDocs, string | null>>({
  id_doc_url: null,
  licence_url: null,
  vehicle_photo_url: null,
  selfie_url: null,
});
const uploadedCount = computed(() => Object.values(docs).filter(Boolean).length);
const isReady = computed(() => !!vehicleId.value && uploadedCount.value === 4 && !!payoutMethod.value && !mustWaitToRetry.value);

const rejectedText = computed(() => {
  const reason = verification.value?.reject_reason;
  const base = reason ? `Motivo: ${reason}.` : 'Os documentos não foram aceites.';
  const next = mustWaitToRetry.value && retryAt.value ?
    `Pode enviar de novo a partir de ${formatDateTime(retryAt.value)}.` :
    'Corrija e envie de novo.';

  return `${base} ${next}`;
});

const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

async function send() {
  if (!vehicleId.value || !isReady.value) {
    submitError.value = 'Faltam passos: escolha o veículo, envie os quatro documentos e indique o método de levantamento.';

    return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  try {
    await submit(vehicleId.value, docs as VerificationDocs);
    toast.add({ title: 'Pedido enviado', description: 'Respondemos em até 12 horas.', color: 'success', icon: 'i-lucide-check' });
    await Promise.all([loadProfile(true), refreshVerification()]);
  } catch (error) {
    submitError.value = messageFor(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UiPage>
    <UiPageHeader
      title="Verificação de condutor"
      description="Ganha a confiança dos passageiros com os teus documentos verificados."
    />

    <p class="mt-1 text-muted">
      É opcional. Com a verificação ganha o selo no perfil e nas viagens e aparece primeiro nos resultados à mesma hora.
    </p>

    <UAlert
      v-if="isVerified"
      class="mt-6"
      color="success"
      variant="soft"
      icon="i-lucide-badge-check"
      title="Condutor verificado"
      :description="profile?.driver_verified_at ? `Documentos confirmados em ${formatDateLong(profile.driver_verified_at)}.` : 'Documentos confirmados.'"
    />

    <UAlert
      v-else-if="isPending && verification"
      class="mt-6"
      color="primary"
      variant="soft"
      icon="i-lucide-hourglass"
      title="Em análise"
      :description="`Pedido enviado em ${formatDateTime(verification.created_at)}. Respondemos em até 12 horas; pode publicar viagens entretanto.`"
    />

    <UAlert
      v-else-if="isRejected && verification"
      class="mt-6"
      color="error"
      variant="soft"
      icon="i-lucide-badge-x"
      title="Verificação recusada"
      :description="rejectedText"
    />

    <div
      v-if="canApply"
      class="mt-6 space-y-4"
    >
      <UCard>
        <template #header>
          <p class="text-sm text-muted">
            Passo 1 de 3
          </p>

          <h2 class="card-title">
            Veículo
          </h2>
        </template>

        <div
          v-if="vehicles.length"
          class="space-y-3"
        >
          <USelect
            v-model="vehicleId"
            :items="vehicleItems"
            size="lg"
            class="w-full"
          />

          <UButton
            variant="link"
            color="neutral"
            icon="i-lucide-plus"
            class="-ms-2"
            @click="isVehicleFormOpen = true"
          >
            Adicionar outro veículo
          </UButton>
        </div>

        <div v-else>
          <p class="text-sm text-muted">
            Ainda não adicionou nenhum veículo.
          </p>

          <UButton
            class="mt-3"
            variant="soft"
            icon="i-lucide-plus"
            @click="isVehicleFormOpen = true"
          >
            Adicionar veículo
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <p class="text-sm text-muted">
            Passo 2 de 3 · {{ uploadedCount }} de 4 enviados
          </p>

          <h2 class="card-title">
            Documentos
          </h2>

          <p class="mt-1 text-sm text-muted">
            Só a moderação da Boleia vê estes ficheiros. São apagados 30 dias depois da decisão.
          </p>
        </template>

        <div class="divide-y divide-default">
          <DriverDocUpload
            v-model="docs.id_doc_url"
            label="Bilhete de identidade"
            hint="Frente do BI, com todos os dados legíveis. Foto ou PDF."
            icon="i-lucide-id-card"
            canBePdf
          />

          <DriverDocUpload
            v-model="docs.licence_url"
            label="Carta de condução"
            hint="Frente da carta, dentro da validade. Foto ou PDF."
            icon="i-lucide-credit-card"
            canBePdf
          />

          <DriverDocUpload
            v-model="docs.vehicle_photo_url"
            label="Veículo com matrícula"
            hint="Fotografia do carro em que se lê a matrícula."
            icon="i-lucide-car"
          />

          <DriverDocUpload
            v-model="docs.selfie_url"
            label="Selfie"
            hint="O seu rosto, sem óculos escuros, com boa luz."
            icon="i-lucide-scan-face"
          />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <p class="text-sm text-muted">
            Passo 3 de 3
          </p>

          <h2 class="card-title">
            Método de levantamento
          </h2>
        </template>

        <div
          v-if="payoutSummary"
          class="flex items-center justify-between gap-3"
        >
          <p class="flex items-center gap-2">
            <UIcon
              name="i-lucide-circle-check"
              class="size-4 text-success"
            />
            {{ payoutSummary }}
          </p>

          <UButton
            to="/conta/perfil"
            variant="link"
            color="neutral"
          >
            Alterar
          </UButton>
        </div>

        <ProfilePayoutMethod
          v-else
          :current="null"
        />
      </UCard>

      <UAlert
        v-if="submitError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="submitError"
      />

      <UButton
        size="xl"
        block
        icon="i-lucide-send"
        :loading="isSubmitting"
        :disabled="!isReady"
        @click="send"
      >
        Enviar para verificação
      </UButton>

      <p
        v-if="!isReady"
        class="text-center text-sm text-muted"
      >
        O botão fica disponível com o veículo escolhido, os quatro documentos enviados e o método de levantamento indicado.
      </p>
    </div>

    <ProfileVehicleForm v-model:open="isVehicleFormOpen" />
  </UiPage>
</template>
