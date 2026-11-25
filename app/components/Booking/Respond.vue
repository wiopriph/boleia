<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


// After the driver finishes: rate (this approves the trip and releases the payment) or dispute.
// After "the trip left without you": only a dispute. Silence closes the booking for the driver.
const props = defineProps<{ booking: BookingRow }>();
const emit = defineEmits<{ changed: [] }>();

const { confirmTrip } = useBooking();
const { toastError } = useBoleiaError();

const isFinished = computed(() => props.booking.stage === 'finished');
const deadline = computed(() => (props.booking.respond_until ? formatDateTime(props.booking.respond_until) : null));
const isApproving = ref(false);
const isDisputeOpen = ref(false);

async function approve() {
  isApproving.value = true;

  try {
    await confirmTrip(props.booking.id);
    await navigateTo(`/avaliar/${props.booking.id}`);
  } catch (error) {
    await toastError(error);
    emit('changed');
  } finally {
    isApproving.value = false;
  }
}
</script>

<template>
  <UCard>
    <h2 class="card-title">
      {{ isFinished ? 'Como correu a viagem?' : 'Estava no ponto de encontro?' }}
    </h2>

    <p class="mt-1 text-sm text-muted">
      <template v-if="isFinished">
        O condutor concluiu a viagem. Ao avaliar, confirma que correu bem e {{ formatKz(booking.price_total_kz) }} seguem para o condutor.
        Se houve um problema, conteste.
      </template>

      <template v-else>
        O condutor iniciou a viagem sem o seu PIN. Se estava no local à hora marcada, conteste: a moderação analisa e o valor fica retido.
      </template>

      <template v-if="deadline">
        {{ isFinished ? 'Sem resposta até' : 'Sem contestação até' }} {{ deadline }}, {{ isFinished ? 'a viagem fica confirmada.' : 'a reserva fecha sem reembolso.' }}
      </template>
    </p>

    <div
      class="mt-4 grid gap-2"
      :class="isFinished ? 'sm:grid-cols-2' : ''"
    >
      <UButton
        v-if="isFinished"
        size="lg"
        block
        icon="i-lucide-star"
        :loading="isApproving"
        @click="approve"
      >
        Avaliar a viagem
      </UButton>

      <UButton
        size="lg"
        block
        :variant="isFinished ? 'soft' : 'solid'"
        :color="isFinished ? 'neutral' : 'error'"
        icon="i-lucide-message-square-warning"
        @click="isDisputeOpen = true"
      >
        Contestar
      </UButton>
    </div>

    <BookingDisputeModal
      v-model:open="isDisputeOpen"
      :booking="booking"
      @opened="emit('changed')"
    />
  </UCard>
</template>
