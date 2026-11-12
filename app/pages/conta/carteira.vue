<script setup lang="ts">
import type { PayoutMethod } from '~~/types/rpc';
import type { WalletMovement } from '~/composables/useWallet';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Carteira', robots: 'noindex' });

const { fetchSummary, fetchMovements, fetchPayouts, pageSize } = useWallet();

const { data: summary, refresh: refreshSummary } = await useAsyncData('wallet-summary', fetchSummary);
const { data: firstMovements, refresh: refreshMovements } = await useAsyncData(
  'wallet-movements',
  () => fetchMovements(),
  { default: () => [] as WalletMovement[] },
);
const { data: payouts, refresh: refreshPayouts } = await useAsyncData('wallet-payouts', fetchPayouts, { default: () => [] });

const olderMovements = ref<WalletMovement[]>([]);
const hasMore = ref(firstMovements.value.length === pageSize);
const isLoadingMore = ref(false);
const movements = computed(() => [...firstMovements.value, ...olderMovements.value]);

async function loadMore() {
  const last = movements.value.at(-1);

  if (!last || isLoadingMore.value) {
    return;
  }

  isLoadingMore.value = true;

  try {
    const page = await fetchMovements(last.id);

    olderMovements.value = [...olderMovements.value, ...page];
    hasMore.value = page.length === pageSize;
  } finally {
    isLoadingMore.value = false;
  }
}

const balance = computed(() => summary.value?.balance_kz ?? 0);
const payoutMethod = computed(() => (summary.value?.payout_method ?? null) as PayoutMethod | null);
const hasOpenPayout = computed(() => payouts.value.some(payout => payout.status === 'requested' || payout.status === 'processing'));
const canWithdraw = computed(() => balance.value >= PAYOUT_MIN_KZ && !hasOpenPayout.value);

const withdrawHint = computed(() => {
  if (hasOpenPayout.value) {
    return 'Já tem um levantamento em curso. Pode pedir outro quando este for pago.';
  }

  if (balance.value < PAYOUT_MIN_KZ) {
    return `Pode levantar a partir de ${formatKz(PAYOUT_MIN_KZ)}.`;
  }

  return 'Processamos os levantamentos uma vez por semana.';
});

const isPayoutOpen = ref(false);

async function onRequested() {
  olderMovements.value = [];
  await Promise.all([refreshSummary(), refreshMovements(), refreshPayouts()]);
  hasMore.value = firstMovements.value.length === pageSize;
}
</script>

<template>
  <UiPage>
    <UiPageHeader
      title="Carteira"
      description="Consulta os teus ganhos, levantamentos e movimentos."
    />

    <UCard class="mt-5">
      <p class="text-sm text-muted">
        Disponível para levantar
      </p>

      <p class="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
        {{ formatKz(balance) }}
      </p>

      <UButton
        class="mt-4"
        size="lg"
        block
        icon="i-lucide-banknote"
        :disabled="!canWithdraw"
        @click="isPayoutOpen = true"
      >
        Levantar
      </UButton>

      <p class="mt-2 text-center text-sm text-muted">
        {{ withdrawHint }}
      </p>

      <USeparator class="my-4" />

      <dl class="grid gap-4 text-sm min-[430px]:grid-cols-3">
        <div>
          <dt class="text-muted">
            Em espera
          </dt>

          <dd class="font-medium tabular-nums">
            {{ formatKz(summary?.pending_kz ?? 0) }}
          </dd>

          <dd class="text-xs text-muted">
            viagens por concluir
          </dd>
        </div>

        <div>
          <dt class="text-muted">
            Em levantamento
          </dt>

          <dd class="font-medium tabular-nums">
            {{ formatKz(summary?.payouts_pending_kz ?? 0) }}
          </dd>

          <dd class="text-xs text-muted">
            pedidos por pagar
          </dd>
        </div>

        <div>
          <dt class="text-muted">
            Total ganho
          </dt>

          <dd class="font-medium tabular-nums">
            {{ formatKz(summary?.earned_total_kz ?? 0) }}
          </dd>

          <dd class="text-xs text-muted">
            viagens concluídas
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Levantamentos
        </h2>
      </template>

      <ul
        v-if="payouts.length"
        class="divide-y divide-default"
      >
        <li
          v-for="payout in payouts"
          :key="payout.id"
          class="flex items-start justify-between gap-3 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ payoutStatusLabel(payout.status) }}
            </p>

            <p class="text-sm text-muted">
              Pedido em {{ formatDateTime(payout.created_at) }}<template v-if="payout.processed_at">
                · tratado em {{ formatDay(payout.processed_at) }}
              </template>
            </p>

            <p class="truncate text-sm text-muted">
              {{ payoutMethodLabel(payout.method as PayoutMethod) }}
            </p>
          </div>

          <p class="shrink-0 font-semibold tabular-nums">
            {{ formatKz(payout.amount_kz) }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Ainda não pediu nenhum levantamento.
      </p>
    </UCard>

    <UCard class="mt-4">
      <template #header>
        <h2 class="card-title">
          Movimentos
        </h2>
      </template>

      <ul
        v-if="movements.length"
        class="divide-y divide-default"
      >
        <li
          v-for="movement in movements"
          :key="movement.id"
          class="flex items-start justify-between gap-3 py-3"
        >
          <div class="min-w-0">
            <p class="font-medium">
              {{ movementLabel(movement.memo) }}
            </p>

            <p class="truncate text-sm text-muted">
              <template v-if="movement.route">
                {{ movement.route }} ·
              </template>{{ formatDateTime(movement.created_at) }}
            </p>
          </div>

          <p
            class="shrink-0 font-semibold tabular-nums"
            :class="movement.amount_kz > 0 ? 'text-success' : ''"
          >
            {{ movement.amount_kz > 0 ? '+' : '' }}{{ formatKz(movement.amount_kz) }}
          </p>
        </li>
      </ul>

      <p
        v-else
        class="text-sm text-muted"
      >
        Os ganhos aparecem aqui depois de cada viagem concluída.
      </p>

      <div
        v-if="hasMore"
        class="mt-3 flex justify-center"
      >
        <UButton
          variant="soft"
          color="neutral"
          :loading="isLoadingMore"
          @click="loadMore"
        >
          Mostrar mais
        </UButton>
      </div>
    </UCard>

    <WalletPayoutModal
      v-model:open="isPayoutOpen"
      :balanceKz="balance"
      :payoutMethod="payoutMethod"
      @requested="onRequested"
    />
  </UiPage>
</template>
