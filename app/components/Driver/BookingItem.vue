<script setup lang="ts">
import type { RevealContactResult } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow, canMarkNoShow: boolean }>();
const emit = defineEmits<{ changed: [], pin: [booking: BookingRow], cancel: [booking: BookingRow] }>();

const { respondBooking, markNoShow } = useDriverTrips();
const { revealContact } = useBooking();
const { toastError, messageFor } = useBoleiaError();
const toast = useToast();

const statusText = computed(() => driverBookingStatusText(props.booking));
const isResponding = ref(false);
const isNoShowOpen = ref(false);
const isMarkingNoShow = ref(false);
const contact = ref<RevealContactResult | null>(null);
const contactError = ref<string | null>(null);
const isRevealing = ref(false);

const isActive = computed(() => props.booking.status === 'accepted' || props.booking.status === 'awaiting_confirm');
const needsPin = computed(() => isActive.value && !props.booking.pin_entered_at);

async function respond(shouldAccept: boolean) {
  isResponding.value = true;

  try {
    await respondBooking(props.booking.id, shouldAccept);

    toast.add({
      title: shouldAccept ? 'Pedido aceite' : 'Pedido recusado',
      description: shouldAccept ? `${props.booking.passenger_name} tem o lugar confirmado.` : 'O passageiro é reembolsado na totalidade.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('changed');
  } catch (error) {
    await toastError(error);
  } finally {
    isResponding.value = false;
  }
}

async function confirmNoShow() {
  isMarkingNoShow.value = true;

  try {
    await markNoShow(props.booking.id);
    isNoShowOpen.value = false;
    toast.add({ title: 'Falta registada', color: 'success', icon: 'i-lucide-check' });
    emit('changed');
  } catch (error) {
    await toastError(error);
  } finally {
    isMarkingNoShow.value = false;
  }
}

async function reveal() {
  isRevealing.value = true;
  contactError.value = null;

  try {
    contact.value = await revealContact(props.booking.id);
  } catch (error) {
    contactError.value = messageFor(error);
  } finally {
    isRevealing.value = false;
  }
}
</script>

<template>
  <li class="py-4">
    <div class="flex items-start gap-3">
      <UAvatar
        :src="booking.passenger_avatar_url ?? undefined"
        :alt="booking.passenger_name"
        icon="i-lucide-user-round"
        size="lg"
      />

      <div class="min-w-0 flex-1">
        <p class="font-medium">
          {{ booking.passenger_name }}<span
            v-if="booking.seats > 1"
            class="text-muted"
          > + {{ booking.seats - 1 }}</span>

          <span class="font-normal text-muted"> · {{ seatsLabel(booking.seats) }}</span>
        </p>

        <p class="text-xs text-muted">
          {{ passengerTrustLine(booking) }}
        </p>

        <p class="mt-1 text-sm font-medium">
          {{ statusText.label }}
        </p>

        <p class="text-sm text-muted">
          {{ statusText.detail }}
        </p>

        <p
          v-if="booking.message"
          class="mt-2 rounded-lg bg-elevated px-3 py-2 text-sm"
        >
          {{ booking.message }}
        </p>
      </div>
    </div>

    <div
      v-if="booking.status === 'requested'"
      class="mt-3 grid grid-cols-2 gap-2"
    >
      <UButton
        block
        icon="i-lucide-check"
        :loading="isResponding"
        @click="respond(true)"
      >
        Aceitar
      </UButton>

      <UButton
        block
        variant="soft"
        color="neutral"
        :disabled="isResponding"
        @click="respond(false)"
      >
        Recusar
      </UButton>
    </div>

    <div
      v-if="isActive"
      class="mt-3 flex flex-wrap gap-2"
    >
      <UButton
        v-if="needsPin"
        icon="i-lucide-key-round"
        @click="emit('pin', booking)"
      >
        Introduzir PIN
      </UButton>

      <UButton
        v-if="needsPin && canMarkNoShow"
        variant="soft"
        color="neutral"
        icon="i-lucide-user-x"
        @click="isNoShowOpen = true"
      >
        Não apareceu
      </UButton>

      <UButton
        v-if="!contact"
        variant="soft"
        color="neutral"
        icon="i-lucide-phone"
        :loading="isRevealing"
        @click="reveal"
      >
        Ver contacto
      </UButton>

      <UButton
        v-else
        :to="`tel:${contact.phone}`"
        external
        variant="soft"
        icon="i-lucide-phone"
      >
        Ligar {{ formatPhone(contact.phone) }}
      </UButton>
    </div>

    <p
      v-if="contactError"
      class="mt-2 text-sm text-error"
    >
      {{ contactError }}
    </p>

    <div class="mt-2 flex flex-wrap gap-2">
      <UButton
        v-if="booking.conversation_id"
        :to="`/conta/mensagens/${booking.conversation_id}`"
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-message-circle"
      >
        Conversa
      </UButton>

      <UButton
        v-if="booking.status === 'completed' || booking.status === 'no_show'"
        :to="`/avaliar/${booking.id}`"
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-star"
      >
        Avaliar passageiro
      </UButton>

      <UButton
        v-if="booking.status === 'accepted'"
        variant="ghost"
        color="error"
        size="sm"
        icon="i-lucide-x"
        @click="emit('cancel', booking)"
      >
        Cancelar esta reserva
      </UButton>
    </div>

    <UModal
      v-model:open="isNoShowOpen"
      :title="`${booking.passenger_name} não apareceu?`"
      description="Só fica registado como falta se outro passageiro desta viagem já tiver dado o PIN. Sem isso, o caso segue para a moderação."
    >
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isNoShowOpen = false"
        >
          Voltar
        </UButton>

        <UButton
          color="error"
          :loading="isMarkingNoShow"
          @click="confirmNoShow"
        >
          Marcar falta
        </UButton>
      </template>
    </UModal>
  </li>
</template>
