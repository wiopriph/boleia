<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow }>();
const emit = defineEmits<{ changed: [] }>();

const { confirmTrip } = useBooking();
const { toastError } = useBoleiaError();
const toast = useToast();

const isConfirming = ref(false);
const isDisputeOpen = ref(false);

async function answer(didHappen: boolean) {
  isConfirming.value = true;

  try {
    await confirmTrip(props.booking.id, didHappen);
    isDisputeOpen.value = false;

    toast.add({
      title: didHappen ? 'Obrigado, viagem confirmada' : 'Enviado para a moderação',
      description: didHappen ? 'O pagamento segue para o condutor.' : 'Vamos analisar o caso e avisamos do resultado.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('changed');
  } catch (error) {
    await toastError(error);
  } finally {
    isConfirming.value = false;
  }
}
</script>

<template>
  <UCard>
    <h2 class="card-title">
      Chegou bem?
    </h2>

    <p class="mt-1 text-sm text-muted">
      Ao confirmar, {{ formatKz(booking.paid_total_kz) }} deixam de estar retidos e o condutor recebe o pagamento.
      Sem resposta, a viagem é confirmada automaticamente.
    </p>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <UButton
        size="lg"
        block
        icon="i-lucide-thumbs-up"
        :loading="isConfirming"
        @click="answer(true)"
      >
        Sim, cheguei
      </UButton>

      <UButton
        size="lg"
        block
        variant="soft"
        color="neutral"
        @click="isDisputeOpen = true"
      >
        Não viajei
      </UButton>
    </div>

    <UModal
      v-model:open="isDisputeOpen"
      title="Não fez esta viagem?"
      description="O caso segue para a moderação da Boleia, que analisa a conversa e o PIN de embarque. O valor fica retido até à decisão."
    >
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isDisputeOpen = false"
        >
          Voltar
        </UButton>

        <UButton
          color="error"
          :loading="isConfirming"
          @click="answer(false)"
        >
          Confirmar que não viajei
        </UButton>
      </template>
    </UModal>
  </UCard>
</template>
