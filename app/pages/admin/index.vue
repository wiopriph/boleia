<script setup lang="ts">
const { data: stats, error } = await useAdminStats();

const queues = computed(() => {
  const current = stats.value?.queues;

  return current ?
    [
      { label: 'Verificações pendentes', count: current.verifications, to: '/admin/verificacoes' },
      { label: 'Denúncias abertas', count: current.reports_open, to: '/admin/denuncias' },
      { label: 'Disputas', count: current.disputes, to: '/admin/disputas' },
      { label: 'Levantamentos por tratar', count: current.payouts, to: '/admin/levantamentos' },
      { label: 'Reembolsos automáticos em fila', count: current.refunds_pending, to: '/admin/dinheiro' },
      { label: 'Reembolsos a fazer à mão', count: current.refunds_manual, to: '/admin/dinheiro' },
    ] :
    [];
});

const periods = computed(() => {
  const current = stats.value;

  return current ?
    [
      { label: 'Novos utilizadores', today: String(current.today.new_users), week: String(current.week.new_users) },
      { label: 'Viagens publicadas', today: String(current.today.trips_published), week: String(current.week.trips_published) },
      { label: 'Reservas pagas', today: String(current.today.bookings_paid), week: String(current.week.bookings_paid) },
      { label: 'Volume pago', today: formatKz(current.today.gmv_kz), week: formatKz(current.week.gmv_kz) },
      { label: 'Taxa de serviço', today: 'sem dado', week: formatKz(current.week.fee_kz) },
      { label: 'Pagamentos falhados', today: String(current.today.payment_failed), week: 'sem dado' },
    ] :
    [];
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">
      Resumo
    </h1>

    <UAlert
      v-if="error || !stats"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar o resumo"
      description="Atualize a página para tentar de novo."
    />

    <template v-else>
      <h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
        Filas
      </h2>

      <ul class="mt-3 grid gap-2 sm:grid-cols-2">
        <li
          v-for="queue in queues"
          :key="queue.label"
        >
          <NuxtLink
            :to="queue.to"
            class="flex items-center justify-between gap-3 rounded-lg border border-default p-3 transition-colors hover:border-primary"
          >
            <span class="text-sm">{{ queue.label }}</span>

            <span class="text-xl font-semibold tabular-nums">{{ queue.count }}</span>
          </NuxtLink>
        </li>
      </ul>

      <h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Atividade
      </h2>

      <UCard class="mt-3">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="pb-2 font-normal" />

              <th class="pb-2 text-right font-normal">
                Hoje
              </th>

              <th class="pb-2 text-right font-normal">
                7 dias
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-default">
            <tr
              v-for="period in periods"
              :key="period.label"
            >
              <td class="py-2">
                {{ period.label }}
              </td>

              <td class="py-2 text-right font-medium tabular-nums">
                {{ period.today }}
              </td>

              <td class="py-2 text-right font-medium tabular-nums">
                {{ period.week }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Estado do sistema
      </h2>

      <UCard class="mt-3">
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt>
              Última execução das tarefas automáticas
            </dt>

            <dd class="text-right font-medium">
              {{ stats.health.scheduler_last_run ? formatDateTime(stats.health.scheduler_last_run) : 'nunca' }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>
              Notificações falhadas em 24 horas
            </dt>

            <dd class="font-medium tabular-nums">
              {{ stats.health.notifications_failed_24h }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>
              Diferenças na reconciliação em 7 dias
            </dt>

            <dd class="font-medium tabular-nums">
              {{ stats.health.reconciliation_mismatches_7d }}
            </dd>
          </div>
        </dl>

        <UAlert
          v-for="job in stats.health.scheduler_errors"
          :key="job.job"
          class="mt-3"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="`Tarefa com erro: ${job.job}`"
          :description="`${job.error}${job.at ? ` (${formatDateTime(job.at)})` : ''}`"
        />

        <p
          v-if="!stats.health.scheduler_errors.length"
          class="mt-3 text-sm text-muted"
        >
          Nenhuma tarefa automática com erro.
        </p>
      </UCard>
    </template>
  </div>
</template>
