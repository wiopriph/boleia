<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminLedgerBalance, AdminRefund } from '~/composables/useAdmin';


useSeoMeta({ title: 'Dinheiro', robots: 'noindex' });

const { fetchLedgerBalances, fetchRefundQueue, markRefundManual, fetchLedgerRange } = useAdmin();
const { messageFor } = useBoleiaError();
const { data: stats } = await useAdminStats();
const toast = useToast();

const { data: balances, error: balancesError, refresh: refreshBalances } = await useAsyncData(
  'admin-ledger-balances',
  fetchLedgerBalances,
  { default: () => [] as AdminLedgerBalance[] },
);
const { data: refunds, error: refundsError, refresh: refreshRefunds } = await useAsyncData(
  'admin-refund-queue',
  fetchRefundQueue,
  { default: () => [] as AdminRefund[] },
);

const current = ref<AdminRefund | null>(null);
const isRefundOpen = ref(false);

function openRefund(refund: AdminRefund) {
  current.value = refund;
  isRefundOpen.value = true;
}

async function runRefund(payload: AdminActionPayload) {
  await markRefundManual(current.value!.payment_id, payload.reason);
  toast.add({ title: 'Reembolso marcado como feito', color: 'success', icon: 'i-lucide-check' });
}

async function onRefunded() {
  await Promise.all([refreshRefunds(), refreshBalances(), refreshAdminStats()]);
}

const today = toLuandaDateString();
const exportFrom = ref(addDays(today, -30));
const exportTo = ref(today);
const isExporting = ref(false);
const exportError = ref<string | null>(null);

async function exportCsv() {
  if (!isValidDateString(exportFrom.value) || !isValidDateString(exportTo.value) || exportFrom.value > exportTo.value) {
    exportError.value = 'Escolha um período válido.';

    return;
  }

  isExporting.value = true;
  exportError.value = null;

  try {
    const entries = await fetchLedgerRange(
      toLuandaIso(exportFrom.value, '00:00'),
      toLuandaIso(addDays(exportTo.value, 1), '00:00'),
    );

    if (!entries.length) {
      exportError.value = 'Não há movimentos neste período.';

      return;
    }

    const csv = toCsv(
      ['id', 'data_luanda', 'operacao', 'conta', 'montante_kz', 'utilizador', 'reserva', 'levantamento', 'memo'],
      entries.map(entry => [
        entry.id,
        `${toLuandaDateString(entry.created_at)} ${formatTime(entry.created_at)}`,
        entry.op_id,
        entry.account,
        entry.amount_kz,
        entry.user_id,
        entry.booking_id,
        entry.payout_id,
        entry.memo,
      ]),
    );

    downloadTextFile(`boleia-movimentos-${exportFrom.value}-${exportTo.value}.csv`, csv);
    toast.add({ title: `${entries.length} movimentos exportados`, color: 'success', icon: 'i-lucide-check' });
  } catch (failure) {
    exportError.value = messageFor(failure);
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Dinheiro
    </h1>

    <UCard class="mt-5">
      <template #header>
        <h2 class="font-semibold">
          Saldos por conta
        </h2>
      </template>

      <UAlert
        v-if="balancesError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Não foi possível carregar os saldos"
      />

      <template v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="pb-2 font-normal">
                Conta
              </th>

              <th class="pb-2 text-right font-normal">
                Movimentos
              </th>

              <th class="pb-2 text-right font-normal">
                Saldo
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-default">
            <tr
              v-for="balance in balances"
              :key="balance.account"
            >
              <td class="py-2">
                {{ ledgerAccountLabel(balance.account) }}
              </td>

              <td class="py-2 text-right tabular-nums text-muted">
                {{ balance.entries }}
              </td>

              <td class="py-2 text-right font-medium tabular-nums">
                {{ formatKz(balance.balance_kz) }}
              </td>
            </tr>
          </tbody>
        </table>

        <p class="mt-3 text-sm text-muted">
          Cada operação é registada em duas contas, por isso a soma de todos os saldos é zero.
        </p>
      </template>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="font-semibold">
          Reembolsos por entregar
        </h2>
      </template>

      <UAlert
        v-if="refundsError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="Não foi possível carregar os reembolsos"
      />

      <p
        v-else-if="!refunds.length"
        class="text-sm text-muted"
      >
        Todos os reembolsos chegaram aos passageiros.
      </p>

      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="refund in refunds"
          :key="refund.payment_id"
          class="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ refund.is_manual ? 'Precisa de transferência manual' : 'Reembolso automático em curso' }}
            </p>

            <p class="text-muted">
              <NuxtLink
                :to="`/admin/utilizadores/${refund.payer_id}`"
                class="font-medium text-default hover:text-primary"
              >
                {{ refund.payer_name }}
              </NuxtLink>
              · {{ formatPhone(refund.payer_phone) || 'sem telefone' }}
            </p>

            <p class="text-muted">
              {{ refund.refund_attempts }} de 3 tentativas falhadas<template v-if="refund.refund_failed_at">
                · última em {{ formatDateTime(refund.refund_failed_at) }}
              </template>
            </p>

            <p class="break-all text-muted">
              Referência do pagamento: {{ refund.provider_ref || 'sem referência' }}
            </p>
          </div>

          <div class="text-right">
            <p class="text-lg font-semibold tabular-nums">
              {{ formatKz(refund.refund_kz) }}
            </p>

            <p class="text-xs text-muted">
              de {{ formatKz(refund.amount_kz) }} pagos
            </p>

            <UButton
              v-if="refund.is_manual"
              class="mt-2"
              size="sm"
              @click="openRefund(refund)"
            >
              Marcar como devolvido
            </UButton>
          </div>
        </li>
      </ul>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="font-semibold">
          Levantamentos
        </h2>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          {{ stats?.queues.payouts ?? 0 }} pedidos por tratar.
        </p>

        <UButton
          to="/admin/levantamentos"
          color="neutral"
          variant="outline"
          size="sm"
        >
          Abrir a fila
        </UButton>
      </div>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="font-semibold">
          Exportar movimentos
        </h2>
      </template>

      <form
        class="flex flex-wrap items-end gap-3"
        @submit.prevent="exportCsv"
      >
        <UFormField label="De">
          <UInput
            v-model="exportFrom"
            type="date"
            :max="exportTo"
          />
        </UFormField>

        <UFormField label="Até">
          <UInput
            v-model="exportTo"
            type="date"
            :min="exportFrom"
            :max="today"
          />
        </UFormField>

        <UButton
          type="submit"
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          :loading="isExporting"
        >
          Exportar CSV
        </UButton>
      </form>

      <p class="mt-3 text-sm text-muted">
        Todos os movimentos do período, com datas na hora de Luanda.
      </p>

      <UAlert
        v-if="exportError"
        class="mt-3"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="exportError"
      />
    </UCard>

    <AdminActionModal
      v-model:open="isRefundOpen"
      :title="`Reembolso de ${formatKz(current?.refund_kz ?? 0)} feito à mão`"
      :description="`Confirme só depois de a transferência estar feita. Destinatário: ${current?.payer_name ?? 'passageiro'}`"
      confirmLabel="Marcar como devolvido"
      reasonLabel="Referência da transferência"
      :action="runRefund"
      @done="onRefunded"
    />
  </div>
</template>
