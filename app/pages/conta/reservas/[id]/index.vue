<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Reserva', robots: 'noindex' });

const route = useRoute();
const bookingId = String(route.params.id ?? '');
const { fetchBooking } = useBooking();

const { data: booking, refresh } = await useAsyncData(`booking:${bookingId}`, () => fetchBooking(bookingId));

const statusText = computed(() => (booking.value ? bookingStatusText(booking.value) : null));
const isCancelOpen = ref(false);

const vehicleLine = computed(() => {
  const current = booking.value;

  if (!current) {
    return '';
  }

  const plateEnd = current.vehicle_plate_suffix?.replace(/[^0-9a-z]/gi, '');

  return [
    `${current.vehicle_make} ${current.vehicle_model}`,
    current.vehicle_color,
    plateEnd ? `matrícula termina em ${plateEnd}` : null,
  ].filter(Boolean).join(' · ');
});

const canPay = computed(() => booking.value?.status === 'pending_payment' || booking.value?.status === 'payment_failed');
const canCancel = computed(() => booking.value?.status === 'requested' || booking.value?.status === 'accepted');
const isTripDayVisible = computed(() => booking.value?.status === 'accepted' || booking.value?.status === 'awaiting_confirm');
const canReview = computed(() => booking.value?.status === 'completed' || booking.value?.status === 'no_show');

useRealtimeBookings((change) => {
  const row = change.new as { id?: string } | null;

  if (row?.id === bookingId) {
    refresh();
  }
});
</script>

<template>
  <UContainer class="max-w-2xl py-8">
    <UButton
      to="/conta/reservas"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="-ms-2"
    >
      As minhas reservas
    </UButton>

    <template v-if="!booking">
      <UAlert
        class="mt-4"
        color="neutral"
        variant="soft"
        icon="i-lucide-ticket-x"
        title="Reserva não encontrada"
        description="A ligação pode estar errada ou a reserva pertence a outra conta."
      />
    </template>

    <template v-else>
      <p class="mt-2 text-sm text-muted">
        {{ formatDayLong(booking.departure_at) }}
      </p>

      <h1 class="mt-1 text-2xl font-semibold">
        {{ booking.origin_name }} <span class="text-muted">para</span> {{ booking.destination_name }}
      </h1>

      <div class="mt-5 space-y-4">
        <UCard v-if="statusText">
          <div class="flex items-start gap-3">
            <UIcon
              :name="statusText.tone === 'success' ? 'i-lucide-circle-check' : statusText.tone === 'error' ? 'i-lucide-circle-x' : 'i-lucide-info'"
              class="mt-0.5 size-6 shrink-0"
              :class="{
                'text-success': statusText.tone === 'success',
                'text-error': statusText.tone === 'error',
                'text-primary': statusText.tone === 'primary',
                'text-warning': statusText.tone === 'warning',
                'text-muted': statusText.tone === 'neutral',
              }"
            />

            <div class="min-w-0 flex-1">
              <p class="font-semibold">
                {{ statusText.label }}
              </p>

              <p class="text-sm text-muted">
                {{ statusText.detail }}
              </p>
            </div>
          </div>

          <UButton
            v-if="canPay"
            class="mt-4"
            block
            size="lg"
            icon="i-lucide-credit-card"
            :to="`/conta/reservas/${booking.id}/pagamento`"
          >
            {{ booking.status === 'pending_payment' ? 'Continuar pagamento' : 'Tentar pagar de novo' }}
          </UButton>

          <UButton
            v-if="canReview"
            class="mt-4"
            block
            size="lg"
            icon="i-lucide-star"
            :to="`/avaliar/${booking.id}`"
          >
            Avaliar a viagem
          </UButton>
        </UCard>

        <BookingConfirmArrival
          v-if="booking.status === 'awaiting_confirm'"
          :booking="booking"
          @changed="refresh"
        />

        <BookingTripDay
          v-if="isTripDayVisible"
          :booking="booking"
        />

        <UCard>
          <dl class="space-y-3 text-sm">
            <div class="flex gap-3">
              <dt class="w-20 shrink-0 text-muted">
                Partida
              </dt>

              <dd>
                <span class="font-medium">{{ formatTime(booking.departure_at) }}, {{ booking.origin_name }}</span>

                <span
                  v-if="booking.origin_detail"
                  class="block text-muted"
                >{{ booking.origin_detail }}</span>
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-20 shrink-0 text-muted">
                Chegada
              </dt>

              <dd>
                <span class="font-medium">{{ booking.destination_name }}</span>

                <span
                  v-if="booking.destination_detail"
                  class="block text-muted"
                >{{ booking.destination_detail }}</span>
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-20 shrink-0 text-muted">
                Lugares
              </dt>

              <dd>
                {{ seatsLabel(booking.seats) }}
              </dd>
            </div>
          </dl>

          <USeparator class="my-4" />

          <dl class="space-y-1 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">
                Lugares
              </dt>

              <dd class="tabular-nums">
                {{ formatKz(booking.price_total_kz) }}
              </dd>
            </div>

            <div class="flex justify-between">
              <dt class="text-muted">
                Taxa de serviço
              </dt>

              <dd class="tabular-nums">
                {{ formatKz(booking.fee_kz) }}
              </dd>
            </div>

            <div class="flex justify-between font-medium">
              <dt>
                Total
              </dt>

              <dd class="tabular-nums">
                {{ formatKz(booking.paid_total_kz) }}
              </dd>
            </div>

            <div
              v-if="booking.refund_kz > 0"
              class="flex justify-between"
            >
              <dt class="text-muted">
                Reembolsado
              </dt>

              <dd class="tabular-nums">
                {{ formatKz(booking.refund_kz) }}
              </dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <NuxtLink
            :to="`/perfil/${booking.driver_id}`"
            class="flex items-center gap-3"
          >
            <UAvatar
              :src="booking.driver_avatar_url ?? undefined"
              :alt="booking.driver_name"
              icon="i-lucide-user-round"
              size="lg"
            />

            <div class="min-w-0 flex-1">
              <p class="font-medium">
                {{ booking.driver_name }}
              </p>

              <p class="text-sm text-muted">
                {{ vehicleLine }}
              </p>
            </div>

            <UIcon
              name="i-lucide-chevron-right"
              class="size-5 text-muted"
            />
          </NuxtLink>

          <UButton
            v-if="booking.conversation_id"
            class="mt-4"
            block
            variant="soft"
            color="neutral"
            icon="i-lucide-message-circle"
            :to="`/conta/mensagens/${booking.conversation_id}`"
          >
            Abrir conversa
          </UButton>
        </UCard>

        <UButton
          v-if="canCancel"
          block
          variant="ghost"
          color="error"
          icon="i-lucide-x"
          @click="isCancelOpen = true"
        >
          Cancelar reserva
        </UButton>

        <BookingCancelModal
          v-model:open="isCancelOpen"
          :booking="booking"
          @cancelled="refresh"
        />
      </div>
    </template>
  </UContainer>
</template>
