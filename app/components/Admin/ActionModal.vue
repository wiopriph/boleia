<script setup lang="ts">
export interface AdminActionPayload {
  reason: string
  days: number | null
  amountKz: number | null
}

// One confirmation dialog for every admin action: the reason is asked here, the RPC runs in `action`.
const props = withDefaults(defineProps<{
  title: string
  description?: string
  confirmLabel: string
  action: (payload: AdminActionPayload) => Promise<unknown>
  isDestructive?: boolean
  reasonLabel?: string
  reasonHelp?: string
  hasReason?: boolean
  isReasonRequired?: boolean
  hasDays?: boolean
  // set for a partial refund: the amount must stay below it
  amountBelowKz?: number | null
}>(), {
  description: undefined,
  isDestructive: false,
  reasonLabel: 'Motivo',
  reasonHelp: undefined,
  hasReason: true,
  isReasonRequired: true,
  hasDays: false,
  amountBelowKz: null,
});
const emit = defineEmits<{ done: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { messageFor } = useBoleiaError();

const reason = ref('');
const days = ref(7);
const amountKz = ref(0);
const isRunning = ref(false);
const errorText = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    reason.value = '';
    days.value = 7;
    amountKz.value = 0;
    errorText.value = null;
  }
});

async function confirm() {
  const trimmed = reason.value.trim();

  if (props.hasReason && props.isReasonRequired && !trimmed) {
    errorText.value = `Preencha o campo "${props.reasonLabel}".`;

    return;
  }

  if (props.hasDays && (!Number.isInteger(days.value) || days.value < 1)) {
    errorText.value = 'Indique o número de dias.';

    return;
  }

  if (props.amountBelowKz !== null && (amountKz.value < 1 || amountKz.value >= props.amountBelowKz)) {
    errorText.value = `O montante tem de ficar entre 1 Kz e ${formatKz(props.amountBelowKz - 1)}.`;

    return;
  }

  isRunning.value = true;
  errorText.value = null;

  try {
    await props.action({
      reason: trimmed,
      days: props.hasDays ? days.value : null,
      amountKz: props.amountBelowKz !== null ? amountKz.value : null,
    });

    isOpen.value = false;
    emit('done');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isRunning.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
  >
    <template #body>
      <div class="space-y-4">
        <slot />

        <UFormField
          v-if="amountBelowKz !== null"
          label="Montante a devolver ao passageiro (Kz)"
          :help="`Menos de ${formatKz(amountBelowKz)}. O resto segue para o condutor.`"
        >
          <UInputNumber
            v-model="amountKz"
            :formatOptions="{ useGrouping: false }"
            :min="0"
            :step="500"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="hasDays"
          label="Dias de suspensão"
        >
          <UInputNumber
            v-model="days"
            :min="1"
            :max="365"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="hasReason"
          :label="reasonLabel"
          :help="reasonHelp"
          :required="isReasonRequired"
        >
          <UTextarea
            v-model="reason"
            :rows="3"
            :maxlength="500"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorText"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="errorText"
        />
      </div>
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        color="neutral"
        @click="isOpen = false"
      >
        Voltar
      </UButton>

      <UButton
        :color="isDestructive ? 'error' : 'primary'"
        :loading="isRunning"
        @click="confirm"
      >
        {{ confirmLabel }}
      </UButton>
    </template>
  </UModal>
</template>
