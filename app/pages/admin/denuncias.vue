<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { AdminReport } from '~/composables/useAdmin';


useSeoMeta({ title: 'Denúncias', robots: 'noindex' });

const { fetchReports, resolveReport } = useAdmin();
const { toastError } = useBoleiaError();
const toast = useToast();

const { data: items, error, refresh } = await useAsyncData('admin-reports', fetchReports, { default: () => [] });

const current = ref<AdminReport | null>(null);
const isDismissOpen = ref(false);
const isModerateOpen = ref(false);
const reviewingId = ref<string | null>(null);

async function onDone() {
  await Promise.all([refresh(), refreshAdminStats()]);
}

async function markReviewed(item: AdminReport) {
  reviewingId.value = item.id;

  try {
    await resolveReport(item.id, 'reviewed');
    await refresh();
  } catch (failure) {
    await toastError(failure);
  } finally {
    reviewingId.value = null;
  }
}

function openDismiss(item: AdminReport) {
  current.value = item;
  isDismissOpen.value = true;
}

function openModerate(item: AdminReport) {
  current.value = item;
  isModerateOpen.value = true;
}

async function dismiss(payload: AdminActionPayload) {
  await resolveReport(current.value!.id, 'dismissed', payload.reason || undefined);
  toast.add({ title: 'Denúncia arquivada', color: 'success', icon: 'i-lucide-check' });
}

async function onModerated() {
  toast.add({ title: 'Ação aplicada e denúncia fechada', color: 'success', icon: 'i-lucide-check' });
  await onDone();
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Denúncias
    </h1>

    <p class="mt-1 text-sm text-muted">
      Abertas e em análise, da mais antiga para a mais recente.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as denúncias"
    />

    <AdminEmpty
      v-else-if="!items.length"
      class="mt-6"
      title="Sem denúncias por tratar"
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
            <div>
              <p class="font-semibold">
                {{ reportReasonLabel(item.reason) }}
              </p>

              <p class="text-sm text-muted">
                {{ reportStatusLabel(item.status) }} · recebida em {{ formatDateTime(item.created_at) }}
              </p>
            </div>
          </div>

          <p
            v-if="item.details"
            class="mt-3 whitespace-pre-wrap break-words rounded-lg bg-elevated/50 p-3 text-sm"
          >
            {{ item.details }}
          </p>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminUserLine
              :profile="item.target"
              role="Denunciado"
            />

            <AdminUserLine
              :profile="item.reporter"
              role="Quem denunciou"
            />
          </div>

          <template v-if="item.booking">
            <p class="mt-4 text-sm">
              <span class="text-muted">Reserva:</span>
              {{ item.booking.origin_name }} para {{ item.booking.destination_name }},
              {{ item.booking.departure_at ? formatDateTime(item.booking.departure_at) : 'data desconhecida' }}
              · {{ item.booking.status ? bookingStatusLabel(item.booking.status).toLowerCase() : 'estado desconhecido' }}
              · {{ formatKz(item.booking.paid_total_kz) }} pagos
            </p>

            <h3 class="mt-4 text-sm font-semibold">
              Conversa
            </h3>

            <AdminChatLog
              class="mt-2"
              :bookingId="item.booking_id!"
              :passengerId="item.booking.passenger_id"
              :driverId="item.booking.driver_id"
            />
          </template>

          <p
            v-else
            class="mt-4 text-sm text-muted"
          >
            Denúncia feita a partir do perfil, sem reserva associada.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <UButton
              :disabled="!item.target"
              @click="openModerate(item)"
            >
              Aplicar ação
            </UButton>

            <UButton
              v-if="item.status === 'open'"
              color="neutral"
              variant="outline"
              :loading="reviewingId === item.id"
              @click="markReviewed(item)"
            >
              Marcar em análise
            </UButton>

            <UButton
              color="neutral"
              variant="outline"
              @click="openDismiss(item)"
            >
              Arquivar
            </UButton>
          </div>
        </UCard>
      </li>
    </ul>

    <AdminActionModal
      v-model:open="isDismissOpen"
      title="Arquivar denúncia"
      description="A denúncia fica fechada sem ação sobre o utilizador."
      confirmLabel="Arquivar"
      reasonLabel="Nota interna"
      :isReasonRequired="false"
      :action="dismiss"
      @done="onDone"
    />

    <AdminModerateModal
      v-if="current?.target"
      v-model:open="isModerateOpen"
      :targetId="current.target.id"
      :targetName="current.target.display_name"
      :targetStatus="current.target.status"
      :reportId="current.id"
      @done="onModerated"
    />
  </div>
</template>
