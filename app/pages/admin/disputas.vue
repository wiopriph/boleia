<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminDispute } from '~/composables/useAdmin';
import type { DisputeOutcome } from '~~/types/rpc';


useSeoMeta({ title: 'Disputas', robots: 'noindex' });

const { fetchDisputes, resolveDispute } = useAdmin();
const toast = useToast();

const { data: items, error, refresh } = await useAsyncData('admin-disputes', fetchDisputes, { default: () => [] });

const OUTCOMES: Record<DisputeOutcome, { title: string, description: string, confirmLabel: string }> = {
  completed: {
    title: 'A viagem aconteceu',
    description: 'A reserva fica concluída e o valor segue para o condutor.',
    confirmLabel: 'Concluir a favor do condutor',
  },
  refund_full: {
    title: 'Reembolso total',
    description: 'O passageiro recebe tudo de volta e o condutor fica com uma falta registada.',
    confirmLabel: 'Devolver tudo ao passageiro',
  },
  refund_partial: {
    title: 'Reembolso parcial',
    description: 'A reserva fica concluída: uma parte volta para o passageiro e o resto segue para o condutor.',
    confirmLabel: 'Devolver uma parte',
  },
};

const current = ref<AdminDispute | null>(null);
const outcome = ref<DisputeOutcome>('completed');
const isOpen = ref(false);

function open(item: AdminDispute, nextOutcome: DisputeOutcome) {
  current.value = item;
  outcome.value = nextOutcome;
  isOpen.value = true;
}

async function resolve(payload: AdminActionPayload) {
  await resolveDispute(current.value!.id!, outcome.value, payload.amountKz ?? undefined);
  toast.add({ title: 'Disputa resolvida', color: 'success', icon: 'i-lucide-check' });
}

async function onDone() {
  await Promise.all([refresh(), refreshAdminStats()]);
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Disputas
    </h1>

    <p class="mt-1 text-sm text-muted">
      Reservas em que o passageiro marcou "Não viajei".
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as disputas"
    />

    <AdminEmpty
      v-else-if="!items.length"
      class="mt-6"
      title="Sem disputas por resolver"
    />

    <ul
      v-else
      class="mt-5 space-y-4"
    >
      <li
        v-for="item in items"
        :key="item.id ?? ''"
      >
        <UCard>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold">
                {{ item.origin_name }} <span class="font-normal text-muted">para</span> {{ item.destination_name }}
              </p>

              <p class="text-sm text-muted">
                Partida em {{ item.departure_at ? formatDateTime(item.departure_at) : 'data desconhecida' }}
                · {{ seatsLabel(item.seats ?? 1) }}
              </p>
            </div>

            <div class="text-right">
              <p class="text-xl font-semibold tabular-nums">
                {{ formatKz(item.paid_total_kz) }}
              </p>

              <p class="text-xs text-muted">
                pago pelo passageiro, taxa de {{ formatKz(item.fee_kz) }} incluída
              </p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminUserLine
              :profile="item.passenger"
              role="Passageiro"
            />

            <AdminUserLine
              :profile="item.driver"
              role="Condutor"
            />
          </div>

          <ul class="mt-4 space-y-1 text-sm">
            <li>
              <span class="text-muted">PIN:</span>
              {{ item.pin_entered_at ? `introduzido pelo condutor em ${formatDateTime(item.pin_entered_at)}` : 'não foi introduzido' }}
            </li>

            <li>
              <span class="text-muted">Chegada do condutor:</span>
              {{ item.driver_arrived_at ? `marcada em ${formatDateTime(item.driver_arrived_at)}` : 'não foi marcada' }}
            </li>

            <li v-if="item.wait_until">
              <span class="text-muted">Espera combinada:</span>
              até {{ formatDateTime(item.wait_until) }}
            </li>
          </ul>

          <h3 class="mt-4 text-sm font-semibold">
            Conversa
          </h3>

          <AdminChatLog
            v-if="item.id"
            class="mt-2"
            :bookingId="item.id"
            :passengerId="item.passenger_id"
            :driverId="item.driver_id"
          />

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="open(item, 'completed')"
            >
              A viagem aconteceu
            </UButton>

            <UButton
              color="neutral"
              variant="outline"
              @click="open(item, 'refund_full')"
            >
              Reembolso total
            </UButton>

            <UButton
              color="neutral"
              variant="outline"
              @click="open(item, 'refund_partial')"
            >
              Reembolso parcial
            </UButton>
          </div>
        </UCard>
      </li>
    </ul>

    <AdminActionModal
      v-model:open="isOpen"
      :title="OUTCOMES[outcome].title"
      :description="OUTCOMES[outcome].description"
      :confirmLabel="OUTCOMES[outcome].confirmLabel"
      :hasReason="false"
      :isDestructive="outcome !== 'completed'"
      :amountBelowKz="outcome === 'refund_partial' ? (current?.paid_total_kz ?? 0) : null"
      :action="resolve"
      @done="onDone"
    />
  </div>
</template>
