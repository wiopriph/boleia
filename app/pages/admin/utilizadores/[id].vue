<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminTrip } from '~/composables/useAdmin';
import type { BookingRow } from '~/utils/booking-status';
import type { Enums, PayoutMethod } from '~~/types/rpc';


const route = useRoute();
const id = String(route.params.id ?? '');
const { fetchUserDetail, cancelTrip, cancelBooking } = useAdmin();
const toast = useToast();

const { data: detail, refresh } = await useAsyncData(`admin-user:${id}`, () => fetchUserDetail(id));

if (!detail.value) {
  throw createError({ statusCode: 404, fatal: true });
}

useSeoMeta({ title: () => detail.value?.user.display_name ?? 'Utilizador', robots: 'noindex' });

const user = computed(() => detail.value!.user);
const latestVerification = computed(() => detail.value?.verifications[0] ?? null);

const verificationLine = computed(() => {
  const latest = latestVerification.value;

  if (!latest) {
    return '';
  }

  const line = `Último pedido: ${verificationStatusLabel(latest.status).toLowerCase()}, enviado em ${formatDateTime(latest.created_at)}.`;

  return latest.reject_reason ? `${line} Motivo da recusa: ${latest.reject_reason}` : line;
});

const facts = computed(() => [
  { label: 'Conta', value: profileStatusLabel(user.value.status, user.value.suspended_until) },
  { label: 'Condutor', value: driverStatusLabel(user.value.driver_status) },
  { label: 'Avaliação', value: ratingLabel(user.value.rating_avg, user.value.rating_count) },
  { label: 'Viagens como condutor', value: String(user.value.trips_driven) },
  { label: 'Viagens como passageiro', value: String(user.value.trips_ridden) },
  { label: 'Cancelamentos', value: String(user.value.cancels_total) },
  { label: 'Faltas', value: String(user.value.no_shows) },
  { label: 'Saldo', value: formatKz(user.value.balance_kz) },
  { label: 'Registo', value: formatDateTime(user.value.created_at) },
  { label: 'Última atividade', value: user.value.last_seen_at ? formatDateTime(user.value.last_seen_at) : 'sem registo' },
]);

const CANCELLABLE_TRIPS: Enums<'trip_status'>[] = ['draft', 'published', 'full'];
const CANCELLABLE_BOOKINGS: Enums<'booking_status'>[] = ['pending_payment', 'requested', 'accepted', 'awaiting_confirm', 'disputed'];

const isModerateOpen = ref(false);
const isTripOpen = ref(false);
const isBookingOpen = ref(false);
const currentTrip = ref<AdminTrip | null>(null);
const currentBooking = ref<BookingRow | null>(null);

function openTrip(trip: AdminTrip) {
  currentTrip.value = trip;
  isTripOpen.value = true;
}

function openBooking(booking: BookingRow) {
  currentBooking.value = booking;
  isBookingOpen.value = true;
}

async function runCancelTrip(payload: AdminActionPayload) {
  const result = await cancelTrip(currentTrip.value!.id, payload.reason);

  toast.add({
    title: 'Viagem retirada',
    description: `${result.cancelled_bookings} reservas canceladas, ${formatKz(result.refunded_kz)} devolvidos.`,
    color: 'success',
    icon: 'i-lucide-check',
  });
}

async function runCancelBooking(payload: AdminActionPayload) {
  const result = await cancelBooking(currentBooking.value!.id!, payload.reason);

  toast.add({
    title: 'Reserva cancelada',
    description: `${formatKz(result.refund_kz)} devolvidos ao passageiro.`,
    color: 'success',
    icon: 'i-lucide-check',
  });
}

async function onModerated() {
  toast.add({ title: 'Ação aplicada', color: 'success', icon: 'i-lucide-check' });
  await refresh();
}

function vehicleLine(vehicle: NonNullable<typeof detail.value>['vehicles'][number]) {
  return [`${vehicle.make} ${vehicle.model}`, vehicle.color, vehicle.year, vehicle.plate ?? 'sem matrícula'].filter(Boolean).join(', ');
}
</script>

<template>
  <div v-if="detail">
    <UButton
      to="/admin/utilizadores"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="-ml-2"
    >
      Utilizadores
    </UButton>

    <div class="mt-2 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UAvatar
          :src="user.avatar_url ?? undefined"
          :alt="user.display_name"
          size="3xl"
        />

        <div>
          <h1 class="page-title">
            {{ user.display_name }}
          </h1>

          <p class="text-muted">
            {{ formatPhone(user.phone) || 'sem telefone' }}
            <template v-if="user.is_admin">
              · administrador
            </template>
          </p>

          <NuxtLink
            :to="`/perfil/${user.id}`"
            class="text-sm font-medium text-primary"
          >
            Ver perfil público e avaliações
          </NuxtLink>
        </div>
      </div>

      <UButton
        v-if="!user.is_admin && user.status !== 'deleted'"
        icon="i-lucide-shield-alert"
        @click="isModerateOpen = true"
      >
        Moderar
      </UButton>
    </div>

    <UCard class="mt-5">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div
          v-for="fact in facts"
          :key="fact.label"
        >
          <dt class="text-muted">
            {{ fact.label }}
          </dt>

          <dd class="font-medium">
            {{ fact.value }}
          </dd>
        </div>

        <div class="col-span-2 sm:col-span-3">
          <dt class="text-muted">
            Destino dos levantamentos
          </dt>

          <dd class="break-all font-medium">
            {{ payoutMethodLabel(detail.payoutMethod as PayoutMethod | null) ?? 'por indicar' }}
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Verificação e viaturas
        </h2>
      </template>

      <template v-if="latestVerification">
        <p class="text-sm">
          {{ verificationLine }}
        </p>

        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminDocPreview
            :path="latestVerification.id_doc_url"
            label="Documento de identificação"
          />

          <AdminDocPreview
            :path="latestVerification.licence_url"
            label="Carta de condução"
          />

          <AdminDocPreview
            :path="latestVerification.vehicle_photo_url"
            label="Viatura com matrícula"
          />

          <AdminDocPreview
            :path="latestVerification.selfie_url"
            label="Selfie"
          />
        </div>
      </template>

      <p
        v-else
        class="text-sm text-muted"
      >
        Nunca pediu verificação.
      </p>

      <ul
        v-if="detail.vehicles.length"
        class="mt-4 space-y-1 text-sm"
      >
        <li
          v-for="vehicle in detail.vehicles"
          :key="vehicle.id"
        >
          {{ vehicleLine(vehicle) }}
          <span class="text-muted">
            · {{ vehicle.verified ? 'verificada' : 'não verificada' }}<template v-if="vehicle.status === 'removed'"> · removida</template>
          </span>
        </li>
      </ul>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Viagens como condutor
        </h2>
      </template>

      <ul
        v-if="detail.trips.length"
        class="divide-y divide-default"
      >
        <li
          v-for="trip in detail.trips"
          :key="trip.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ trip.origin?.name }} <span class="font-normal text-muted">para</span> {{ trip.destination?.name }}
            </p>

            <p class="text-muted">
              {{ formatDateTime(trip.departure_at) }} · {{ tripStatusText(trip.status).label.toLowerCase() }}
              · {{ formatKz(trip.price_per_seat_kz) }} por lugar
              · {{ trip.seats_available }} de {{ trip.seats_offered }} lugares livres
            </p>
          </div>

          <UButton
            v-if="CANCELLABLE_TRIPS.includes(trip.status)"
            color="neutral"
            variant="outline"
            size="sm"
            @click="openTrip(trip)"
          >
            Retirar viagem
          </UButton>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem viagens publicadas.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Reservas como passageiro
        </h2>
      </template>

      <ul
        v-if="detail.bookings.length"
        class="divide-y divide-default"
      >
        <li
          v-for="booking in detail.bookings"
          :key="booking.id ?? ''"
          class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ booking.origin_name }} <span class="font-normal text-muted">para</span> {{ booking.destination_name }}
            </p>

            <p class="text-muted">
              {{ booking.departure_at ? formatDateTime(booking.departure_at) : 'data desconhecida' }}
              · {{ booking.status ? bookingStatusLabel(booking.status).toLowerCase() : 'estado desconhecido' }}
              · {{ formatKz(booking.paid_total_kz) }} pagos<template v-if="booking.refund_kz">
                · {{ formatKz(booking.refund_kz) }} devolvidos
              </template>
              · condutor {{ booking.driver_name }}
            </p>
          </div>

          <UButton
            v-if="booking.status && CANCELLABLE_BOOKINGS.includes(booking.status)"
            color="neutral"
            variant="outline"
            size="sm"
            @click="openBooking(booking)"
          >
            Cancelar reserva
          </UButton>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem reservas.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Pagamentos
        </h2>
      </template>

      <ul
        v-if="detail.payments.length"
        class="divide-y divide-default"
      >
        <li
          v-for="payment in detail.payments"
          :key="payment.id"
          class="flex items-start justify-between gap-3 py-3 text-sm"
        >
          <div>
            <p class="font-medium">
              {{ paymentStatusLabel(payment.status) }}
            </p>

            <p class="text-muted">
              Criado em {{ formatDateTime(payment.created_at) }}<template v-if="payment.paid_at">
                · pago em {{ formatDateTime(payment.paid_at) }}
              </template>

              <template v-if="payment.refund_kz">
                · {{ formatKz(payment.refund_kz) }} a devolver,
                {{ payment.refunded_at ? `devolvidos em ${formatDateTime(payment.refunded_at)}` : 'ainda por devolver' }}
              </template>
            </p>
          </div>

          <p class="shrink-0 font-semibold tabular-nums">
            {{ formatKz(payment.amount_kz) }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem pagamentos.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Movimentos de saldo
        </h2>
      </template>

      <ul
        v-if="detail.ledger.length"
        class="divide-y divide-default"
      >
        <li
          v-for="entry in detail.ledger"
          :key="entry.id"
          class="flex items-start justify-between gap-3 py-3 text-sm"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ movementLabel(entry.memo) }}
            </p>

            <p class="truncate text-muted">
              {{ ledgerAccountLabel(entry.account) }} · {{ formatDateTime(entry.created_at) }}<template v-if="entry.memo">
                · {{ entry.memo }}
              </template>
            </p>
          </div>

          <p class="shrink-0 font-semibold tabular-nums">
            {{ entry.amount_kz > 0 ? '+' : '' }}{{ formatKz(entry.amount_kz) }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem movimentos.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Denúncias recebidas
        </h2>
      </template>

      <ul
        v-if="detail.reports.length"
        class="divide-y divide-default"
      >
        <li
          v-for="report in detail.reports"
          :key="report.id"
          class="py-3 text-sm"
        >
          <p class="font-medium">
            {{ reportReasonLabel(report.reason) }}
            <span class="font-normal text-muted">· {{ reportStatusLabel(report.status).toLowerCase() }} · {{ formatDateTime(report.created_at) }}</span>
          </p>

          <p
            v-if="report.details"
            class="mt-1 whitespace-pre-wrap break-words text-muted"
          >
            {{ report.details }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem denúncias.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Ações de moderação
        </h2>
      </template>

      <ul
        v-if="detail.actions.length"
        class="divide-y divide-default"
      >
        <li
          v-for="action in detail.actions"
          :key="action.id"
          class="py-3 text-sm"
        >
          <p class="font-medium">
            {{ modActionLabel(action.action) }}
            <span class="font-normal text-muted">
              · {{ formatDateTime(action.created_at) }}<template v-if="action.until"> · até {{ formatDateTime(action.until) }}</template>
            </span>
          </p>

          <p
            v-if="action.reason"
            class="mt-1 whitespace-pre-wrap break-words text-muted"
          >
            {{ action.reason }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Sem ações registadas.
      </p>
    </UCard>

    <AdminModerateModal
      v-model:open="isModerateOpen"
      :targetId="user.id"
      :targetName="user.display_name"
      :targetStatus="user.status"
      @done="onModerated"
    />

    <AdminActionModal
      v-model:open="isTripOpen"
      title="Retirar viagem"
      :description="currentTrip ? `${currentTrip.origin?.name} para ${currentTrip.destination?.name}, ${formatDateTime(currentTrip.departure_at)}. As reservas pagas são canceladas com reembolso total.` : undefined"
      confirmLabel="Retirar viagem"
      isDestructive
      reasonHelp="O condutor vê este motivo na notificação."
      :action="runCancelTrip"
      @done="refresh"
    />

    <AdminActionModal
      v-model:open="isBookingOpen"
      title="Cancelar reserva"
      :description="currentBooking ? `${currentBooking.origin_name} para ${currentBooking.destination_name}. O passageiro recebe o valor todo de volta.` : undefined"
      confirmLabel="Cancelar reserva"
      isDestructive
      reasonLabel="Motivo (interno)"
      :action="runCancelBooking"
      @done="refresh"
    />
  </div>
</template>
