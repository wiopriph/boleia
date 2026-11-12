<script setup lang="ts">
import type { TripPublic } from '~/composables/useTrip';


const props = defineProps<{ trip: TripPublic, isOwnTrip: boolean }>();

const user = useSupabaseUser();
const route = useRoute();
const { requestBooking } = useBooking();
const { load: loadProfile, isComplete } = useProfile();
const { toastError } = useBoleiaError();

const maxSeats = computed(() => Math.min(MAX_SEATS, props.trip.seats_available));
const isFull = computed(() => props.trip.status === 'full' || maxSeats.value <= 0);
const seats = ref(1);
const isReserving = ref(false);

const seatItems = computed(() => Array.from({ length: Math.max(maxSeats.value, 1) }, (_, index) => ({
  label: seatsLabel(index + 1),
  value: index + 1,
})));

const total = computed(() => seats.value * props.trip.price_per_seat_kz);

async function reserve() {
  if (!user.value) {
    await navigateTo({ path: '/entrar', query: { redirect: route.fullPath } });

    return;
  }

  isReserving.value = true;

  try {
    await loadProfile();

    // a name is the minimum the driver needs to see; the full profile comes later
    if (!isComplete.value) {
      await navigateTo({ path: '/conta/perfil', query: { onboarding: '1', redirect: route.fullPath } });

      return;
    }

    const result = await requestBooking(props.trip.id, seats.value);
    // dev only: carry the mock gateway scenario over to the payment page
    const simulate = import.meta.dev && typeof route.query.simulate === 'string' ? { simulate: route.query.simulate } : {};

    await navigateTo({ path: `/conta/reservas/${result.booking_id}/pagamento`, query: simulate });
  } catch (error) {
    await toastError(error);
  } finally {
    isReserving.value = false;
  }
}
</script>

<template>
  <UCard>
    <h2 class="card-title mb-5">
      A tua reserva
    </h2>

    <template v-if="isOwnTrip">
      <p class="font-medium">
        Esta é a sua viagem
      </p>

      <UButton
        class="mt-3"
        block
        variant="soft"
        :to="`/conta/viagens/${trip.id}`"
        icon="i-lucide-settings-2"
      >
        Gerir a minha viagem
      </UButton>
    </template>

    <template v-else>
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-2xl font-semibold tabular-nums">
          {{ formatKz(trip.price_per_seat_kz) }}
        </p>

        <p class="text-sm text-muted">
          por lugar
        </p>
      </div>

      <template v-if="!isFull">
        <UFormField
          label="Lugares"
          class="mt-4"
        >
          <USelect
            v-model="seats"
            :items="seatItems"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <dl class="mt-5 space-y-3 rounded-control bg-muted p-4 text-sm">
          <div class="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <dt class="text-muted">
              {{ seats }} x {{ formatKz(trip.price_per_seat_kz) }}
            </dt>

            <dd class="tabular-nums">
              {{ formatKz(total) }}
            </dd>
          </div>

          <div class="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <dt class="text-muted">
              Taxa de serviço
            </dt>

            <dd class="text-muted">
              calculada no passo seguinte
            </dd>
          </div>
        </dl>

        <UButton
          class="mt-4"
          size="xl"
          block
          icon="i-lucide-ticket"
          :loading="isReserving"
          @click="reserve"
        >
          Reservar {{ seatsLabel(seats) }}
        </UButton>

        <p class="mt-2 text-center text-xs text-muted">
          Paga na Multicaixa Express. O dinheiro fica protegido até ao fim da viagem.
        </p>
      </template>

      <UAlert
        v-else
        class="mt-4"
        color="neutral"
        variant="soft"
        icon="i-lucide-users"
        title="Viagem cheia"
        description="Já não há lugares. Pode perguntar ao condutor se vai repetir a viagem."
      />
    </template>
  </UCard>
</template>
