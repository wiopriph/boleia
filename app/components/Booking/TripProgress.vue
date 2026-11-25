<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


// On board and during the trip the passenger has nothing to confirm: only help. A report goes to the
// moderators and does not touch the money; a dispute becomes possible when the driver finishes.
const props = defineProps<{ booking: BookingRow }>();

const supportEmail = useRuntimeConfig().public.supportEmail;
const isReportOpen = ref(false);
const isInTrip = computed(() => props.booking.stage === 'in_trip');
</script>

<template>
  <UCard>
    <h2 class="card-title">
      {{ isInTrip ? 'Durante a viagem' : 'À espera da partida' }}
    </h2>

    <p class="mt-1 text-sm text-muted">
      <template v-if="booking.pin_entered_at">
        PIN registado às {{ formatTime(booking.pin_entered_at) }}.
      </template>

      {{ isInTrip ? 'Quando chegar ao destino, o condutor conclui a viagem e pode avaliá-la ou contestá-la aqui.' : 'A viagem começa quando o condutor a iniciar.' }}
    </p>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <UButton
        block
        variant="soft"
        color="neutral"
        icon="i-lucide-flag"
        @click="isReportOpen = true"
      >
        Reportar um problema
      </UButton>

      <UButton
        v-if="supportEmail"
        block
        variant="soft"
        color="neutral"
        icon="i-lucide-life-buoy"
        :to="`mailto:${supportEmail}?subject=${encodeURIComponent(`Reserva ${booking.id}`)}`"
        external
      >
        Falar com o apoio
      </UButton>
    </div>

    <p class="mt-3 text-xs text-muted">
      Em perigo imediato, ligue para a polícia: 113.
    </p>

    <ProfileReportModal
      v-model:open="isReportOpen"
      :targetId="booking.driver_id"
      :targetName="booking.driver_name"
      :tripId="booking.trip_id"
      :bookingId="booking.id"
    />
  </UCard>
</template>
