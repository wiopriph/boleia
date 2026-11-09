<script setup lang="ts">
import type { TripPublic } from '~/composables/useTrip';


const props = defineProps<{ trip: TripPublic, isOwnTrip: boolean }>();

const user = useSupabaseUser();
const route = useRoute();

const maxSeats = computed(() => Math.min(MAX_SEATS, props.trip.seats_available));
const isFull = computed(() => props.trip.status === 'full' || maxSeats.value <= 0);
const seats = ref(1);

const seatItems = computed(() => Array.from({ length: Math.max(maxSeats.value, 1) }, (_, index) => ({
  label: seatsLabel(index + 1),
  value: index + 1,
})));

const total = computed(() => seats.value * props.trip.price_per_seat_kz);

function reserve() {
  if (!user.value) {
    navigateTo({ path: '/entrar', query: { redirect: route.fullPath } });

    return;
  }

  // the booking and payment flow is the next screen; until then the button only signs the user in
  useToast().add({ title: 'Reservas em breve', description: 'O pagamento está a ser ligado.', color: 'neutral' });
}
</script>

<template>
  <UCard>
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
      <div class="flex items-baseline justify-between">
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

        <dl class="mt-4 space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted">
              {{ seats }} x {{ formatKz(trip.price_per_seat_kz) }}
            </dt>

            <dd class="tabular-nums">
              {{ formatKz(total) }}
            </dd>
          </div>

          <div class="flex justify-between">
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
