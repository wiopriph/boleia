<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminVerification } from '~/composables/useAdmin';


useSeoMeta({ title: 'Verificações', robots: 'noindex' });

const { fetchVerifications, reviewVerification } = useAdmin();
const toast = useToast();

const { data: items, error, refresh } = await useAsyncData('admin-verifications', fetchVerifications, { default: () => [] });

const current = ref<AdminVerification | null>(null);
const isApproveOpen = ref(false);
const isRejectOpen = ref(false);

function open(item: AdminVerification, shouldApprove: boolean) {
  current.value = item;
  isApproveOpen.value = shouldApprove;
  isRejectOpen.value = !shouldApprove;
}

async function approve(payload: AdminActionPayload) {
  await reviewVerification(current.value!.id, true, payload.reason || undefined);
  toast.add({ title: 'Verificação aprovada', color: 'success', icon: 'i-lucide-check' });
}

async function reject(payload: AdminActionPayload) {
  await reviewVerification(current.value!.id, false, payload.reason);
  toast.add({ title: 'Verificação recusada', color: 'success', icon: 'i-lucide-check' });
}

async function onDone() {
  await Promise.all([refresh(), refreshAdminStats()]);
}

function vehicleLine(item: AdminVerification) {
  const vehicle = item.vehicle;

  return vehicle ?
    [`${vehicle.make} ${vehicle.model}`, vehicle.color, vehicle.year, vehicle.plate ?? 'sem matrícula', seatsLabel(vehicle.seats_total)].filter(Boolean).join(', ') :
    'Viatura não encontrada';
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Verificações
    </h1>

    <p class="mt-1 text-sm text-muted">
      Pedidos pendentes, do mais antigo para o mais recente.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar os pedidos"
    />

    <AdminEmpty
      v-else-if="!items.length"
      class="mt-6"
      title="Sem pedidos de verificação pendentes"
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

            <p class="text-sm text-muted">
              Pedido em {{ formatDateTime(item.created_at) }}
            </p>
          </div>

          <p class="mt-3 text-sm">
            <span class="text-muted">Viatura:</span> {{ vehicleLine(item) }}
          </p>

          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminDocPreview
              :path="item.id_doc_url"
              label="Documento de identificação"
            />

            <AdminDocPreview
              :path="item.licence_url"
              label="Carta de condução"
            />

            <AdminDocPreview
              :path="item.vehicle_photo_url"
              label="Viatura com matrícula"
            />

            <AdminDocPreview
              :path="item.selfie_url"
              label="Selfie"
            />
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              icon="i-lucide-badge-check"
              @click="open(item, true)"
            >
              Aprovar
            </UButton>

            <UButton
              color="neutral"
              variant="outline"
              @click="open(item, false)"
            >
              Recusar
            </UButton>
          </div>
        </UCard>
      </li>
    </ul>

    <AdminActionModal
      v-model:open="isApproveOpen"
      :title="`Aprovar ${current?.user?.display_name ?? 'condutor'}`"
      description="O condutor e a viatura passam a aparecer como verificados."
      confirmLabel="Aprovar"
      reasonLabel="Nota interna"
      :isReasonRequired="false"
      :action="approve"
      @done="onDone"
    />

    <AdminActionModal
      v-model:open="isRejectOpen"
      :title="`Recusar ${current?.user?.display_name ?? 'condutor'}`"
      confirmLabel="Recusar"
      isDestructive
      reasonHelp="O condutor vê este motivo e pode enviar novos documentos."
      :action="reject"
      @done="onDone"
    />
  </div>
</template>
