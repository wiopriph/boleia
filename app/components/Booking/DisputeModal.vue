<script setup lang="ts">
import type { DisputeReason } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


// A dispute freezes the money of this booking until the moderator decides (open_dispute, boleia-db 0025).
const props = defineProps<{ booking: BookingRow }>();
const emit = defineEmits<{ opened: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { openDispute } = useBooking();
const { messageFor } = useBoleiaError();
const toast = useToast();

const isBoarded = computed(() => !!props.booking.pin_entered_at);
const reasons = computed(() => (isBoarded.value ? DISPUTE_REASONS_AFTER_TRIP : DISPUTE_REASONS_NOT_BOARDED));

const reason = ref<DisputeReason | undefined>(undefined);
const details = ref('');
const isSending = ref(false);
const errorText = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    reason.value = undefined;
    details.value = '';
    errorText.value = null;
  }
});

async function send() {
  const text = details.value.trim();

  if (!reason.value) {
    errorText.value = 'Escolha o motivo.';

    return;
  }

  if (text.length < DISPUTE_DETAILS_MIN) {
    errorText.value = 'Descreva o que aconteceu.';

    return;
  }

  isSending.value = true;
  errorText.value = null;

  try {
    await openDispute(props.booking.id, reason.value, text);
    isOpen.value = false;

    toast.add({
      title: 'Contestação enviada',
      description: 'A moderação da Boleia vai analisar e avisa do resultado.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('opened');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Contestar a viagem"
    :description="`${formatKz(booking.paid_total_kz)} ficam retidos até à decisão da moderação.`"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="O que aconteceu?">
          <URadioGroup
            v-model="reason"
            :items="reasons"
          />
        </UFormField>

        <UFormField
          label="Descreva com as suas palavras"
          :help="`A moderação lê este texto. O condutor vê apenas o motivo. ${details.length}/${DISPUTE_DETAILS_MAX}`"
        >
          <UTextarea
            v-model="details"
            :rows="4"
            :maxlength="DISPUTE_DETAILS_MAX"
            placeholder="Onde estava, a que horas, o que o condutor fez."
            class="w-full"
          />
        </UFormField>

        <p
          v-if="errorText"
          role="alert"
          class="text-sm text-error"
        >
          {{ errorText }}
        </p>
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
        color="error"
        :loading="isSending"
        @click="send"
      >
        Enviar contestação
      </UButton>
    </template>
  </UModal>
</template>
