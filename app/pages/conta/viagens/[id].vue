<script setup lang="ts">
import type { BookingRow } from '~/utils/booking-status';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'A minha viagem', robots: 'noindex' });

const route = useRoute();
const tripId = String(route.params.id ?? '');
const { fetchMyTrip, fetchTripBookings, confirmIntent, markArrived } = useDriverTrips();
const { toastError } = useBoleiaError();
const toast = useToast();

const { data: trip, refresh: refreshTrip } = await useAsyncData(`driver-trip:${tripId}`, () => fetchMyTrip(tripId));
const { data: bookings, refresh: refreshBookings } = await useAsyncData(
  `driver-trip-bookings:${tripId}`,
  () => fetchTripBookings(tripId),
  { default: () => [] as BookingRow[] },
);

async function refreshAll() {
  await Promise.all([refreshTrip(), refreshBookings()]);
}

const statusText = computed(() => (trip.value ? tripStatusText(trip.value.status) : null));
const isUpcoming = computed(() => !!trip.value && isUpcomingTrip(trip.value));

// `now` ticks so the time windows below open without a reload
const now = ref(Date.now());

useIntervalFn(() => {
  now.value = Date.now();
}, 30_000);

const departureMs = computed(() => (trip.value ? new Date(trip.value.departure_at).getTime() : 0));
const waitUntilMs = computed(() => departureMs.value + (trip.value?.wait_minutes ?? 0) * 60_000);

const HOUR_MS = 60 * 60 * 1000;
const needsIntent = computed(() => !!trip.value && isUpcoming.value && trip.value.status !== 'departed' &&
  !trip.value.driver_confirmed_at && departureMs.value - now.value <= 24 * HOUR_MS);
// driver_arrived window: departure - 3 h .. departure + wait_minutes
const canMarkArrived = computed(() => !!trip.value && isUpcoming.value && !trip.value.driver_arrived_at &&
  now.value >= departureMs.value - 3 * HOUR_MS && now.value <= waitUntilMs.value);
const canMarkNoShow = computed(() => now.value >= waitUntilMs.value);

const activeBookings = computed(() => bookings.value.filter(booking => ['requested', 'accepted', 'awaiting_confirm', 'disputed'].includes(booking.status)));
const closedBookings = computed(() => bookings.value.filter(booking => !activeBookings.value.includes(booking)));
const seatsSold = computed(() => (trip.value ? trip.value.seats_offered - trip.value.seats_available : 0));
const expectedKz = computed(() => activeBookings.value
  .filter(booking => booking.status !== 'requested')
  .reduce((sum, booking) => sum + booking.price_total_kz, 0));

const isConfirming = ref(false);
const isArriving = ref(false);

async function confirm() {
  isConfirming.value = true;

  try {
    await confirmIntent(tripId);

    toast.add({
      title: 'Viagem confirmada',
      description: 'Os passageiros vêem que vai mesmo viajar.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    await refreshTrip();
  } catch (error) {
    await toastError(error);
  } finally {
    isConfirming.value = false;
  }
}

async function arrive() {
  isArriving.value = true;

  try {
    const result = await markArrived(tripId);

    toast.add({
      title: 'Chegada registada',
      description: `Os passageiros foram avisados. Espera até às ${formatTime(result.wait_until)}.`,
      color: 'success',
      icon: 'i-lucide-check',
    });

    await refreshTrip();
  } catch (error) {
    await toastError(error);
  } finally {
    isArriving.value = false;
  }
}

const pinBooking = ref<BookingRow | null>(null);
const isPinOpen = ref(false);
const cancelTarget = ref<BookingRow | null>(null);
const isCancelOpen = ref(false);

function openPin(booking: BookingRow) {
  pinBooking.value = booking;
  isPinOpen.value = true;
}

function openCancel(booking: BookingRow) {
  cancelTarget.value = booking;
  isCancelOpen.value = true;
}

useRealtimeTripBookings(() => (isUpcoming.value ? [tripId] : []), () => {
  refreshAll();
});
</script>

<template>
  <UiPage>
    <UButton
      to="/conta/viagens"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="-ms-2"
    >
      As minhas viagens
    </UButton>

    <UAlert
      v-if="!trip"
      class="mt-4"
      color="neutral"
      variant="soft"
      icon="i-lucide-car-front"
      title="Viagem não encontrada"
      description="A ligação pode estar errada ou a viagem pertence a outra conta."
    />

    <template v-else>
      <p class="mt-2 text-sm text-muted">
        {{ formatDayLong(trip.departure_at) }}, {{ formatTime(trip.departure_at) }}
      </p>

      <div class="mt-1 flex items-start justify-between gap-3">
        <h1 class="page-title">
          {{ trip.origin?.name }} <span class="text-muted">para</span> {{ trip.destination?.name }}
        </h1>

        <UBadge
          v-if="statusText"
          :color="statusText.tone === 'neutral' ? 'neutral' : statusText.tone"
          variant="subtle"
          class="mt-1 shrink-0"
        >
          {{ statusText.label }}
        </UBadge>
      </div>

      <div class="mt-5 space-y-4">
        <UAlert
          v-if="trip.status === 'cancelled'"
          color="neutral"
          variant="soft"
          icon="i-lucide-ban"
          title="Viagem cancelada"
          :description="trip.cancel_reason ?? undefined"
        />

        <UCard v-if="needsIntent || canMarkArrived || trip.driver_arrived_at">
          <div
            v-if="needsIntent"
            class="flex items-center justify-between gap-3"
          >
            <div>
              <p class="font-medium">
                Vai fazer esta viagem?
              </p>

              <p class="text-sm text-muted">
                Sem confirmação até 6 horas antes, os passageiros podem cancelar sem custos.
              </p>
            </div>

            <UButton
              class="shrink-0"
              icon="i-lucide-thumbs-up"
              :loading="isConfirming"
              @click="confirm"
            >
              Vou viajar
            </UButton>
          </div>

          <USeparator
            v-if="needsIntent && (canMarkArrived || trip.driver_arrived_at)"
            class="my-4"
          />

          <div
            v-if="canMarkArrived"
            class="flex items-center justify-between gap-3"
          >
            <div>
              <p class="font-medium">
                Já está no ponto de encontro?
              </p>

              <p class="text-sm text-muted">
                Os passageiros são avisados e o tempo de espera de {{ trip.wait_minutes }} min fica registado.
              </p>
            </div>

            <UButton
              class="shrink-0"
              icon="i-lucide-map-pin-check"
              :loading="isArriving"
              @click="arrive"
            >
              Cheguei
            </UButton>
          </div>

          <p
            v-else-if="trip.driver_arrived_at"
            class="flex items-center gap-2 text-sm"
          >
            <UIcon
              name="i-lucide-map-pin-check"
              class="size-4 text-success"
            />
            Chegada registada às {{ formatTime(trip.driver_arrived_at) }}. Espera até às {{ formatTime(waitUntilMs) }}.
          </p>
        </UCard>

        <UCard>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-muted">
                Lugares
              </dt>

              <dd class="font-medium">
                {{ seatsSold }} de {{ trip.seats_offered }} reservados
              </dd>
            </div>

            <div>
              <dt class="text-muted">
                Preço por lugar
              </dt>

              <dd class="font-medium tabular-nums">
                {{ formatKz(trip.price_per_seat_kz) }}
              </dd>
            </div>

            <div>
              <dt class="text-muted">
                A receber
              </dt>

              <dd class="font-medium tabular-nums">
                {{ formatKz(expectedKz) }}
              </dd>
            </div>

            <div>
              <dt class="text-muted">
                Reservas
              </dt>

              <dd class="font-medium">
                {{ bookingModeLabel(trip.booking_mode) }}
              </dd>
            </div>

            <div class="col-span-2">
              <dt class="text-muted">
                Encontro e chegada
              </dt>

              <dd>
                {{ [trip.origin_detail, trip.destination_detail].filter(Boolean).join(' · ') || 'Sem pontos indicados' }}
              </dd>
            </div>

            <div
              v-if="trip.notes"
              class="col-span-2"
            >
              <dt class="text-muted">
                Nota
              </dt>

              <dd class="whitespace-pre-wrap">
                {{ trip.notes }}
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="card-title">
              Passageiros
            </h2>
          </template>

          <ul
            v-if="activeBookings.length"
            class="divide-y divide-default"
          >
            <DriverBookingItem
              v-for="booking in activeBookings"
              :key="booking.id"
              :booking="booking"
              :canMarkNoShow="canMarkNoShow"
              @changed="refreshAll"
              @pin="openPin"
              @cancel="openCancel"
            />
          </ul>

          <p
            v-else
            class="text-sm text-muted"
          >
            {{ isUpcoming ? 'Ainda não há reservas pagas. Partilhe a viagem para a encher mais depressa.' : 'Esta viagem não teve reservas pagas.' }}
          </p>

          <template v-if="closedBookings.length">
            <USeparator class="my-4" />

            <p class="text-sm font-medium text-muted">
              Fechadas
            </p>

            <ul class="divide-y divide-default">
              <DriverBookingItem
                v-for="booking in closedBookings"
                :key="booking.id"
                :booking="booking"
                :canMarkNoShow="false"
                @changed="refreshAll"
              />
            </ul>
          </template>
        </UCard>

        <div class="flex flex-wrap items-center gap-2">
          <TripShareButton
            v-if="isUpcoming && trip.status !== 'departed'"
            :tripId="trip.id"
            :title="`Boleia ${trip.origin?.name} para ${trip.destination?.name}, ${formatDay(trip.departure_at)}`"
          />

          <DriverTripActions
            :trip="trip"
            @changed="refreshAll"
          />
        </div>
      </div>

      <DriverPinModal
        v-model:open="isPinOpen"
        :booking="pinBooking"
        @confirmed="refreshAll"
      />

      <BookingCancelModal
        v-if="cancelTarget"
        v-model:open="isCancelOpen"
        :booking="cancelTarget"
        isDriver
        @cancelled="refreshAll"
      />
    </template>
  </UiPage>
</template>
