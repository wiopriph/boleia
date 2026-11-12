<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminPayout } from '~/composables/useAdmin';
import type { PayoutMethod } from '~~/types/rpc';


useSeoMeta({ title: 'Levantamentos', robots: 'noindex' });

const { fetchPayouts, markPayout } = useAdmin();
const { toastError } = useBoleiaError();
const toast = useToast();

const { data: items, error, refresh } = await useAsyncData('admin-payouts', fetchPayouts, { default: () => [] });

const current = ref<AdminPayout | null>(null);
const isPaidOpen = ref(false);
const isFailedOpen = ref(false);
const processingId = ref<string | null>(null);

async function onDone() {
  await Promise.all([refresh(), refreshAdminStats()]);
}

async function markProcessing(item: AdminPayout) {
  processingId.value = item.id;

  try {
    await markPayout(item.id, 'processing');
    await refresh();
  } catch (failure) {
    await toastError(failure);
  } finally {
    processingId.value = null;
  }
}

function open(item: AdminPayout, isPaid: boolean) {
  current.value = item;
  isPaidOpen.value = isPaid;
  isFailedOpen.value = !isPaid;
}

async function markPaid(payload: AdminActionPayload) {
  await markPayout(current.value!.id, 'paid', payload.reason);
  toast.add({ title: 'Levantamento marcado como pago', color: 'success', icon: 'i-lucide-check' });
}

async function markFailed(payload: AdminActionPayload) {
  await markPayout(current.value!.id, 'failed', payload.reason);
  toast.add({ title: 'Levantamento devolvido ao saldo', color: 'success', icon: 'i-lucide-check' });
}

const currentAmount = computed(() => formatKz(current.value?.amount_kz ?? 0));
</script>

<template>
  <div>
    <h1 class="page-title">
      Levantamentos
    </h1>

    <p class="mt-1 text-sm text-muted">
      Pedidos por pagar, do mais antigo para o mais recente.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar os levantamentos"
    />

    <UiEmptyState
      v-else-if="!items.length"
      class="mt-6"
      icon="i-lucide-check-check"
      title="Sem levantamentos por tratar"
    />

    <ul
      v-else
      class="mt-5 space-y-4"
    >
      <li
        v-for="item in items"
        :key="item.id"
      >
        <UCard>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <AdminUserLine :profile="item.user" />

            <p class="text-2xl font-semibold tabular-nums">
              {{ formatKz(item.amount_kz) }}
            </p>
          </div>

          <dl class="mt-3 space-y-1 text-sm">
            <div class="flex gap-2">
              <dt class="text-muted">
                Estado:
              </dt>

              <dd class="font-medium">
                {{ payoutStatusLabel(item.status) }}
              </dd>
            </div>

            <div class="flex gap-2">
              <dt class="text-muted">
                Destino:
              </dt>

              <dd class="break-all">
                {{ payoutMethodLabel(item.method as PayoutMethod) }}
              </dd>
            </div>

            <div class="flex gap-2">
              <dt class="text-muted">
                Pedido em:
              </dt>

              <dd>
                {{ formatDateTime(item.created_at) }}
              </dd>
            </div>
          </dl>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              icon="i-lucide-check"
              @click="open(item, true)"
            >
              Marcar como pago
            </UButton>

            <UButton
              v-if="item.status === 'requested'"
              color="neutral"
              variant="outline"
              :loading="processingId === item.id"
              @click="markProcessing(item)"
            >
              Em processamento
            </UButton>

            <UButton
              color="neutral"
              variant="outline"
              @click="open(item, false)"
            >
              Falhou
            </UButton>
          </div>
        </UCard>
      </li>
    </ul>

    <AdminActionModal
      v-model:open="isPaidOpen"
      :title="`Confirmar pagamento de ${currentAmount}`"
      :description="`Confirme só depois de a transferência estar feita. Destinatário: ${current?.user?.display_name ?? 'condutor'}`"
      confirmLabel="Marcar como pago"
      reasonLabel="Referência da transferência"
      :action="markPaid"
      @done="onDone"
    />

    <AdminActionModal
      v-model:open="isFailedOpen"
      :title="`Levantamento de ${currentAmount} falhou`"
      description="O valor volta para o saldo do condutor."
      confirmLabel="Marcar como falhado"
      isDestructive
      reasonHelp="O condutor vê este motivo na notificação."
      :action="markFailed"
      @done="onDone"
    />
  </div>
</template>
