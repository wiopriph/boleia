<script setup lang="ts">
import type { RevealContactResult } from '~~/types/rpc';
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow }>();

const { revealContact } = useBooking();
const { messageFor } = useBoleiaError();

const contact = ref<RevealContactResult | null>(null);
const isRevealing = ref(false);
const contactError = ref<string | null>(null);

const pinAvailableAt = computed(() => new Date(new Date(props.booking.departure_at).getTime() - 2 * 60 * 60 * 1000));

// reveal_contact logs every view, so the phone is fetched only when asked for
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
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        No dia da viagem
      </h2>
    </template>

    <div
      v-if="booking.pin_code"
      class="rounded-lg bg-elevated p-4 text-center"
    >
      <p class="text-sm text-muted">
        PIN de embarque
      </p>

      <p class="mt-1 font-mono text-4xl font-bold tracking-[0.3em]">
        {{ booking.pin_code }}
      </p>

      <p class="mt-2 text-sm text-muted">
        Diga este PIN ao condutor quando entrar no carro.
        <span v-if="booking.pin_entered_at">Já foi registado às {{ formatTime(booking.pin_entered_at) }}.</span>
      </p>
    </div>

    <p
      v-else
      class="flex items-start gap-2 text-sm"
    >
      <UIcon
        name="i-lucide-key-round"
        class="mt-0.5 size-4 shrink-0 text-muted"
      />
      O PIN de embarque aparece aqui 2 horas antes da partida, às {{ formatTime(pinAvailableAt) }} de {{ formatDay(pinAvailableAt) }}.
    </p>

    <p class="mt-4 flex items-start gap-2 text-sm">
      <UIcon
        :name="booking.driver_arrived_at ? 'i-lucide-map-pin-check' : 'i-lucide-timer'"
        class="mt-0.5 size-4 shrink-0"
        :class="booking.driver_arrived_at ? 'text-success' : 'text-muted'"
      />

      <span v-if="booking.driver_arrived_at">
        O condutor chegou ao ponto de encontro às {{ formatTime(booking.driver_arrived_at) }}<template v-if="booking.wait_until"> e espera até às {{ formatTime(booking.wait_until) }}</template>.
      </span>

      <span v-else>
        Esteja no ponto de encontro à hora marcada. O condutor espera até {{ booking.wait_minutes }} min<template v-if="booking.wait_until">, até às {{ formatTime(booking.wait_until) }}</template>.
      </span>
    </p>

    <USeparator class="my-4" />

    <div
      v-if="contact"
      class="flex items-center justify-between gap-3"
    >
      <div>
        <p class="font-medium">
          {{ contact.display_name }}
        </p>

        <p class="tabular-nums text-muted">
          {{ formatPhone(contact.phone) }}
        </p>
      </div>

      <UButton
        :to="`tel:${contact.phone}`"
        external
        icon="i-lucide-phone"
        size="lg"
      >
        Ligar
      </UButton>
    </div>

    <template v-else>
      <UButton
        variant="soft"
        color="neutral"
        block
        icon="i-lucide-phone"
        :loading="isRevealing"
        @click="reveal"
      >
        Ver contacto do condutor
      </UButton>

      <p
        v-if="contactError"
        class="mt-2 text-sm text-error"
      >
        {{ contactError }}
      </p>
    </template>
  </UCard>
</template>
