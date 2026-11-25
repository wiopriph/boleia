<script setup lang="ts">
import type { DriverTrip } from '~/composables/useDriverTrips';
import type { BookingRow } from '~/utils/booking-status';


// The driver's two actions on the day: start the trip (this records who boarded) and finish it.
const props = defineProps<{ trip: DriverTrip, bookings: BookingRow[], now: number }>();
const emit = defineEmits<{ changed: [] }>();

const { startTrip, finishTrip } = useDriverTrips();
const { toastError } = useBoleiaError();
const toast = useToast();

const HOUR_MS = 60 * 60 * 1000;
const departureMs = computed(() => new Date(props.trip.departure_at).getTime());
const waitUntilMs = computed(() => departureMs.value + props.trip.wait_minutes * 60_000);

const passengers = computed(() => props.bookings.filter(booking => booking.status === 'accepted' || booking.status === 'awaiting_confirm'));
const boarded = computed(() => passengers.value.filter(booking => booking.pin_entered_at));
const missing = computed(() => passengers.value.filter(booking => !booking.pin_entered_at));

const isStarted = computed(() => !!props.trip.started_at);
const isFinished = computed(() => !!props.trip.finished_at);
// boarding opens with the PIN window, 3 hours before departure
const isBoardingOpen = computed(() => !isStarted.value && passengers.value.length > 0 && props.now >= departureMs.value - 3 * HOUR_MS);
const isWaitOver = computed(() => props.now >= waitUntilMs.value);
// start_trip has the same rule: at once when everyone gave the PIN, otherwise after the wait
const canStart = computed(() => isBoardingOpen.value && (missing.value.length === 0 || isWaitOver.value));
// before the wait is over an empty car only means boarding has not begun
const isNobodyOnBoard = computed(() => boarded.value.length === 0 && isWaitOver.value);

const isStartOpen = ref(false);
const isFinishOpen = ref(false);
const isPending = ref(false);

function askStart() {
  // nothing to confirm when everyone is on board
  if (missing.value.length === 0) {
    start();

    return;
  }

  isStartOpen.value = true;
}

async function start() {
  isPending.value = true;

  try {
    const result = await startTrip(props.trip.id);

    isStartOpen.value = false;

    toast.add({
      title: result.on_board ? 'Viagem iniciada' : 'Registado: ninguém apareceu',
      description: result.not_boarded ?
        `${result.not_boarded === 1 ? '1 passageiro não embarcou e foi avisado' : `${result.not_boarded} passageiros não embarcaram e foram avisados`}. Têm 24 horas para contestar.` :
        'Boa viagem. Conclua a viagem quando chegar ao destino.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('changed');
  } catch (error) {
    await toastError(error);
  } finally {
    isPending.value = false;
  }
}

async function finish() {
  isPending.value = true;

  try {
    await finishTrip(props.trip.id);
    isFinishOpen.value = false;

    toast.add({
      title: 'Viagem concluída',
      description: 'Os passageiros foram avisados. O valor entra na carteira quando avaliarem ou ao fim de 24 horas.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('changed');
  } catch (error) {
    await toastError(error);
  } finally {
    isPending.value = false;
  }
}
</script>

<template>
  <UCard v-if="isBoardingOpen || isStarted">
    <template v-if="!isStarted">
      <p class="font-medium">
        {{ boarded.length }} de {{ passengers.length }} a bordo
      </p>

      <p class="mt-1 text-sm text-muted">
        <template v-if="missing.length === 0">
          Todos os passageiros deram o PIN. Pode iniciar a viagem.
        </template>

        <template v-else-if="isWaitOver">
          O tempo de espera terminou às {{ formatTime(waitUntilMs) }}. Pode iniciar sem quem falta: esses passageiros são avisados e têm 24 horas para contestar.
        </template>

        <template v-else>
          Introduza o PIN de cada passageiro ao embarcar. Sem o PIN de todos, só pode iniciar depois do tempo de espera, às {{ formatTime(waitUntilMs) }}.
        </template>
      </p>

      <UButton
        class="mt-4"
        block
        size="lg"
        :icon="isNobodyOnBoard ? 'i-lucide-user-x' : 'i-lucide-play'"
        :color="isNobodyOnBoard ? 'neutral' : 'primary'"
        :variant="isNobodyOnBoard ? 'soft' : 'solid'"
        :disabled="!canStart"
        :loading="isPending"
        @click="askStart"
      >
        {{ isNobodyOnBoard ? 'Ninguém apareceu' : 'Iniciar viagem' }}
      </UButton>
    </template>

    <template v-else-if="!isFinished">
      <p class="font-medium">
        Viagem em curso desde as {{ formatTime(trip.started_at!) }}
      </p>

      <p class="mt-1 text-sm text-muted">
        Quando chegar ao destino, conclua a viagem. Os passageiros são avisados e têm 24 horas para avaliar ou contestar.
      </p>

      <UButton
        class="mt-4"
        block
        size="lg"
        icon="i-lucide-flag"
        @click="isFinishOpen = true"
      >
        Concluir viagem
      </UButton>
    </template>

    <template v-else>
      <p class="flex items-start gap-2 font-medium">
        <UIcon
          name="i-lucide-circle-check"
          class="mt-0.5 size-5 shrink-0 text-success"
        />
        {{ boarded.length ? `Viagem concluída às ${formatTime(trip.finished_at!)}` : 'Viagem fechada: ninguém embarcou' }}
      </p>

      <p class="mt-1 text-sm text-muted">
        <template v-if="trip.closed_by_system">
          Fechámos a viagem por si, porque não a iniciou ou não a concluiu na aplicação. Da próxima vez faça-o para receber mais cedo.
        </template>

        O valor de cada reserva entra na carteira quando o passageiro avaliar ou ao fim de 24 horas sem contestação.
      </p>
    </template>

    <UModal
      v-model:open="isStartOpen"
      :title="isNobodyOnBoard ? 'Ninguém apareceu?' : `Iniciar sem ${missing.length === 1 ? '1 passageiro' : `${missing.length} passageiros`}?`"
      description="Quem não deu o PIN fica registado como não embarcado e é avisado. Tem 24 horas para contestar; sem contestação, o valor da reserva é seu."
    >
      <template #body>
        <ul class="space-y-1 text-sm">
          <li
            v-for="booking in missing"
            :key="booking.id"
            class="flex items-center gap-2"
          >
            <UIcon
              name="i-lucide-user-x"
              class="size-4 shrink-0 text-muted"
            />
            {{ booking.passenger_name }} · {{ seatsLabel(booking.seats) }}
          </li>
        </ul>

        <p class="mt-3 text-sm text-muted">
          Se o passageiro ainda chegar, pode introduzir o PIN dele até concluir a viagem.
        </p>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isStartOpen = false"
        >
          Voltar
        </UButton>

        <UButton
          :loading="isPending"
          @click="start"
        >
          {{ isNobodyOnBoard ? 'Confirmar' : 'Iniciar viagem' }}
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isFinishOpen"
      title="Concluir a viagem?"
      description="Confirme só quando tiver chegado ao destino. Os passageiros são avisados agora e podem avaliar ou contestar durante 24 horas."
    >
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isFinishOpen = false"
        >
          Voltar
        </UButton>

        <UButton
          :loading="isPending"
          @click="finish"
        >
          Concluir viagem
        </UButton>
      </template>
    </UModal>
  </UCard>
</template>
