<script setup lang="ts">
import type { PaymentsInitResult } from '~~/types/rpc';
import type { SimulateMode } from '~/composables/usePayment';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Pagamento', robots: 'noindex' });

const route = useRoute();
const bookingId = String(route.params.id ?? '');
const { fetchBooking, retryPayment } = useBooking();
const { init, status: checkStatus } = usePayment();
const { profile, load: loadProfile } = useProfile();
const { messageFor, toastError } = useBoleiaError();

const { data: booking, refresh } = await useAsyncData(`booking:${bookingId}`, () => fetchBooking(bookingId));

await loadProfile();

const payment = ref<PaymentsInitResult | null>(null);
const isInitializing = ref(false);
const isChecking = ref(false);
const isRetrying = ref(false);
const initError = ref<string | null>(null);
const isTimeUp = ref(false);

const isAwaitingPayment = computed(() => booking.value?.status === 'pending_payment');
const expiresAt = computed(() => payment.value?.expires_at ?? booking.value?.payment_expires_at ?? null);
const statusText = computed(() => (booking.value ? bookingStatusText(booking.value) : null));

// dev only: the mock gateway reads `simulate` to exercise failure and instruction variants
const simulate = computed<SimulateMode | undefined>(() => {
  const value = route.query.simulate;

  return import.meta.dev && typeof value === 'string' ? value as SimulateMode : undefined;
});

async function startPayment() {
  if (!booking.value || !isAwaitingPayment.value) {
    return;
  }

  isInitializing.value = true;
  initError.value = null;

  try {
    payment.value = await init(booking.value.id, simulate.value);
    isTimeUp.value = false;
  } catch (error) {
    initError.value = messageFor(error);
  } finally {
    isInitializing.value = false;
  }
}

async function verify() {
  if (!payment.value) {
    await refresh();

    return;
  }

  isChecking.value = true;

  try {
    await checkStatus(payment.value.payment_id);
    await refresh();
  } catch (error) {
    await toastError(error);
  } finally {
    isChecking.value = false;
  }
}

async function retry() {
  if (!booking.value) {
    return;
  }

  isRetrying.value = true;

  try {
    await retryPayment(booking.value.id);
    await refresh();
    await startPayment();
  } catch (error) {
    await toastError(error);
  } finally {
    isRetrying.value = false;
  }
}

async function onTimeUp() {
  isTimeUp.value = true;
  await verify();
}

useRealtimeBookings((change) => {
  const row = change.new as { id?: string } | null;

  if (row?.id === bookingId) {
    refresh();
  }
});

onMounted(startPayment);
</script>

<template>
  <UiPage>
    <div class="measure-form">
      <template v-if="!booking">
        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-ticket-x"
          title="Reserva não encontrada"
          description="A ligação pode estar errada ou a reserva pertence a outra conta."
        />

        <UButton
          class="mt-4"
          to="/conta/reservas"
          variant="soft"
        >
          As minhas reservas
        </UButton>
      </template>

      <template v-else>
        <p class="text-sm text-muted">
          {{ booking.origin_name }} para {{ booking.destination_name }} · {{ formatDateTime(booking.departure_at) }}
        </p>

        <h1 class="page-title mt-1">
          {{ isAwaitingPayment ? 'Pagamento' : statusText?.label }}
        </h1>

        <UCard class="mt-5">
          <dl class="space-y-1 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">
                {{ seatsLabel(booking.seats) }}
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

            <USeparator class="my-2" />

            <div class="flex items-baseline justify-between">
              <dt class="font-medium">
                Total
              </dt>

              <dd class="text-2xl font-semibold tabular-nums">
                {{ formatKz(booking.paid_total_kz) }}
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- waiting for the gateway -->
        <UCard
          v-if="isAwaitingPayment"
          class="mt-4"
        >
          <div
            v-if="isInitializing && !payment"
            class="flex flex-col items-center gap-3 py-6 text-center"
          >
            <USkeleton class="size-10 rounded-full" />

            <p class="text-sm text-muted">
              A preparar o pagamento...
            </p>
          </div>

          <UAlert
            v-else-if="initError"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="initError"
          >
            <template #actions>
              <UButton
                variant="soft"
                color="error"
                @click="startPayment"
              >
                Tentar de novo
              </UButton>
            </template>
          </UAlert>

          <template v-else>
            <PaymentInstructions
              :instructions="payment?.instructions ?? null"
              :phone="profile?.phone ?? null"
            />

            <USeparator class="my-5" />

            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Tempo para pagar</span>

              <span
                class="font-semibold"
                :class="isTimeUp ? 'text-error' : ''"
              >
                <UiCountdown
                  :until="expiresAt"
                  @expired="onTimeUp"
                />
              </span>
            </div>

            <UButton
              class="mt-4"
              block
              size="lg"
              variant="soft"
              icon="i-lucide-refresh-cw"
              :loading="isChecking"
              @click="verify"
            >
              Verificar pagamento
            </UButton>

            <p class="mt-2 text-center text-xs text-muted">
              A confirmação chega sozinha assim que o pagamento é aprovado.
            </p>
          </template>
        </UCard>

        <!-- outcome -->
        <UCard
          v-else-if="statusText"
          class="mt-4"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="statusText.tone === 'success' ? 'i-lucide-circle-check' : statusText.tone === 'error' ? 'i-lucide-circle-x' : 'i-lucide-hourglass'"
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

          <template v-if="booking.status === 'accepted'">
            <p class="mt-4 text-sm">
              O PIN de embarque e o contacto de {{ booking.driver_name }} aparecem na reserva 2 horas antes da partida.
            </p>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <UButton
                :to="`/conta/reservas/${booking.id}`"
                block
                icon="i-lucide-ticket"
              >
                Ver a minha reserva
              </UButton>

              <UButton
                v-if="booking.conversation_id"
                :to="`/conta/mensagens/${booking.conversation_id}`"
                block
                variant="soft"
                icon="i-lucide-message-circle"
              >
                Abrir conversa
              </UButton>
            </div>
          </template>

          <template v-else-if="booking.status === 'requested'">
            <p class="mt-4 text-sm">
              {{ booking.driver_name }} tem 24 horas para responder. Se recusar ou não responder, devolvemos {{ formatKz(booking.paid_total_kz) }} na totalidade.
            </p>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <UButton
                :to="`/conta/reservas/${booking.id}`"
                block
                icon="i-lucide-ticket"
              >
                Ver a minha reserva
              </UButton>

              <UButton
                v-if="booking.conversation_id"
                :to="`/conta/mensagens/${booking.conversation_id}`"
                block
                variant="soft"
                icon="i-lucide-message-circle"
              >
                Abrir conversa
              </UButton>
            </div>
          </template>

          <template v-else-if="booking.status === 'payment_failed'">
            <UButton
              class="mt-4"
              block
              size="lg"
              icon="i-lucide-rotate-ccw"
              :loading="isRetrying"
              @click="retry"
            >
              Tentar pagar de novo
            </UButton>

            <UButton
              class="mt-2"
              block
              variant="ghost"
              color="neutral"
              :to="`/viagem/${booking.trip_id}`"
            >
              Voltar à viagem
            </UButton>
          </template>

          <UButton
            v-else
            class="mt-4"
            block
            variant="soft"
            to="/conta/reservas"
          >
            As minhas reservas
          </UButton>
        </UCard>
      </template>
    </div>
  </UiPage>
</template>
