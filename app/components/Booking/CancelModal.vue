<script setup lang="ts">
import type { CancelQuote } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow }>();
const emit = defineEmits<{ cancelled: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { cancelQuote, cancelBooking } = useBooking();
const { messageFor } = useBoleiaError();
const toast = useToast();

const quote = ref<CancelQuote | null>(null);
const isLoadingQuote = ref(false);
const isCancelling = ref(false);
const errorText = ref<string | null>(null);

// the refund is whatever cancel_quote says at this moment; nothing is computed on the client
watch(isOpen, async (isOpenNow) => {
  if (!isOpenNow) {
    return;
  }

  quote.value = null;
  errorText.value = null;
  isLoadingQuote.value = true;

  try {
    quote.value = await cancelQuote(props.booking.id);
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isLoadingQuote.value = false;
  }
});

async function confirm() {
  isCancelling.value = true;
  errorText.value = null;

  try {
    const result = await cancelBooking(props.booking.id);

    toast.add({
      title: 'Reserva cancelada',
      description: result.refund_kz > 0 ? `Reembolso de ${formatKz(result.refund_kz)} em 1 a 3 dias úteis.` : 'Sem reembolso.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    isOpen.value = false;
    emit('cancelled');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isCancelling.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Cancelar a reserva?"
    :description="`${booking.origin_name} para ${booking.destination_name}, ${formatDateTime(booking.departure_at)}`"
  >
    <template #body>
      <USkeleton
        v-if="isLoadingQuote"
        class="h-24 w-full"
      />

      <template v-else-if="quote">
        <dl class="space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted">
              Pagou
            </dt>

            <dd class="tabular-nums">
              {{ formatKz(booking.paid_total_kz) }}
            </dd>
          </div>

          <div
            v-if="quote.gateway_fee_kz > 0"
            class="flex justify-between"
          >
            <dt class="text-muted">
              Taxa do pagamento
            </dt>

            <dd class="tabular-nums">
              -{{ formatKz(quote.gateway_fee_kz) }}
            </dd>
          </div>

          <div
            v-if="quote.held_kz > 0"
            class="flex justify-between"
          >
            <dt class="text-muted">
              Fica retido
            </dt>

            <dd class="tabular-nums">
              -{{ formatKz(quote.held_kz) }}
            </dd>
          </div>

          <USeparator class="my-2" />

          <div class="flex items-baseline justify-between">
            <dt class="font-medium">
              Reembolso
            </dt>

            <dd class="text-xl font-semibold tabular-nums">
              {{ formatKz(quote.refund_kz) }}
            </dd>
          </div>
        </dl>

        <p class="mt-3 text-sm text-muted">
          {{ refundRuleText(quote.rule) }}
        </p>

        <p
          v-if="quote.counter"
          class="mt-1 text-sm text-muted"
        >
          Este cancelamento fica registado no seu perfil.
        </p>
      </template>

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
        Manter reserva
      </UButton>

      <UButton
        color="error"
        :loading="isCancelling"
        :disabled="!quote"
        @click="confirm"
      >
        Cancelar reserva
      </UButton>
    </template>
  </UModal>
</template>
