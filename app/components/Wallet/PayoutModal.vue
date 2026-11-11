<script setup lang="ts">
import type { PayoutMethod } from '~~/types/rpc';


const props = defineProps<{ balanceKz: number, payoutMethod: PayoutMethod | null }>();
const emit = defineEmits<{ requested: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { requestPayout } = useWallet();
const { messageFor } = useBoleiaError();
const toast = useToast();

const amount = ref(0);
const isRequesting = ref(false);
const errorText = ref<string | null>(null);

const destination = computed(() => payoutMethodLabel(props.payoutMethod));

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    amount.value = props.balanceKz;
    errorText.value = null;
  }
});

async function confirm() {
  // the limits live in request_payout; these two checks only save a round trip
  if (!amount.value || amount.value < PAYOUT_MIN_KZ) {
    errorText.value = `O mínimo para levantar é ${formatKz(PAYOUT_MIN_KZ)}.`;

    return;
  }

  if (amount.value > props.balanceKz) {
    errorText.value = `Tem ${formatKz(props.balanceKz)} disponíveis.`;

    return;
  }

  isRequesting.value = true;
  errorText.value = null;

  try {
    await requestPayout(amount.value);

    toast.add({
      title: 'Pedido de levantamento enviado',
      description: `${formatKz(amount.value)} seguem para ${destination.value}.`,
      color: 'success',
      icon: 'i-lucide-check',
    });

    isOpen.value = false;
    emit('requested');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isRequesting.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Levantar dinheiro"
    description="Os levantamentos são processados manualmente uma vez por semana."
  >
    <template #body>
      <div
        v-if="destination"
        class="space-y-4"
      >
        <UFormField
          label="Montante (Kz)"
          :help="`Disponível: ${formatKz(balanceKz)}. Mínimo: ${formatKz(PAYOUT_MIN_KZ)}.`"
        >
          <UInputNumber
            v-model="amount"
            :formatOptions="{ useGrouping: false }"
            :min="PAYOUT_MIN_KZ"
            :max="Math.max(balanceKz, PAYOUT_MIN_KZ)"
            :step="1000"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <p class="flex items-start gap-2 text-sm">
          <UIcon
            name="i-lucide-landmark"
            class="mt-0.5 size-4 shrink-0 text-muted"
          />

          <span>Enviamos para <span class="font-medium">{{ destination }}</span>.</span>
        </p>

        <p class="text-sm text-muted">
          Um pedido de cada vez e no máximo um por semana.
        </p>
      </div>

      <UAlert
        v-else
        color="warning"
        variant="soft"
        icon="i-lucide-landmark"
        title="Indique para onde enviar o dinheiro"
        description="Falta o método de levantamento no seu perfil."
      >
        <template #actions>
          <UButton
            to="/conta/perfil"
            color="warning"
            variant="soft"
          >
            Abrir o perfil
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-if="errorText"
        class="mt-3"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="errorText"
      />
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        color="neutral"
        @click="isOpen = false"
      >
        Cancelar
      </UButton>

      <UButton
        icon="i-lucide-banknote"
        :loading="isRequesting"
        :disabled="!destination"
        @click="confirm"
      >
        Pedir levantamento
      </UButton>
    </template>
  </UModal>
</template>
