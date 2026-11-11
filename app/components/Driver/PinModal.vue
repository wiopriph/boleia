<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


const props = defineProps<{ booking: BookingRow | null }>();
const emit = defineEmits<{ confirmed: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { enterPin } = useDriverTrips();
const { messageFor } = useBoleiaError();
const toast = useToast();

const PIN_LENGTH = 4;
// type="number" keeps the numeric keyboard on phones; the model is then an array of numbers
const digits = ref<number[]>([]);
const isChecking = ref(false);
const errorText = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    digits.value = [];
    errorText.value = null;
  }
});

async function submit() {
  const pin = digits.value.join('');

  if (!props.booking || pin.length !== PIN_LENGTH) {
    errorText.value = 'O PIN tem 4 dígitos.';

    return;
  }

  isChecking.value = true;
  errorText.value = null;

  try {
    const result = await enterPin(props.booking.id, pin);

    if (result.ok) {
      toast.add({ title: 'PIN confirmado', description: `${props.booking.passenger_name} está a bordo.`, color: 'success', icon: 'i-lucide-check' });
      isOpen.value = false;
      emit('confirmed');
    } else {
      digits.value = [];
      errorText.value = `PIN incorreto. Restam ${result.attempts_left} tentativas.`;
    }
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isChecking.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="booking ? `PIN de ${booking.passenger_name}` : 'PIN de embarque'"
    description="Peça ao passageiro os 4 dígitos que aparecem na reserva dele. O PIN é a prova de que entrou no carro."
  >
    <template #body>
      <div class="flex flex-col items-center gap-3">
        <UPinInput
          v-model="digits"
          :length="PIN_LENGTH"
          type="number"
          size="xl"
          autofocus
          @complete="submit"
        />

        <p
          v-if="errorText"
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
        Cancelar
      </UButton>

      <UButton
        :loading="isChecking"
        @click="submit"
      >
        Confirmar PIN
      </UButton>
    </template>
  </UModal>
</template>
