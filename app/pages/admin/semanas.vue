<script setup lang="ts">
import type { AdminWeek } from '~~/types/rpc';


useSeoMeta({ title: 'Semanas', robots: 'noindex' });

const WEEK_CHOICES = [4, 8, 12, 26];

const route = useRoute();
const { fetchWeekly } = useAdmin();
const { ensureLoaded, bySlug } = usePlaces();

const weeks = computed(() => {
  const requested = Number(route.query.semanas);

  return WEEK_CHOICES.includes(requested) ? requested : 8;
});

await ensureLoaded();

const { data: rows, error } = await useAsyncData(
  () => `admin-weekly:${weeks.value}`,
  () => fetchWeekly(weeks.value),
  { watch: [weeks], default: () => [] as AdminWeek[] },
);

const weekItems = WEEK_CHOICES.map(count => ({ label: `${count} semanas`, value: count }));

function selectWeeks(count: number) {
  return navigateTo({ path: '/admin/semanas', query: { semanas: String(count) } });
}

function hours(value: number | null) {
  return value === null ? 'sem dados' : `${String(value).replace('.', ',')} h`;
}

function placeName(slug: string) {
  return bySlug(slug)?.name ?? slug;
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">
        Semanas
      </h1>

      <USelect
        :modelValue="weeks"
        :items="weekItems"
        aria-label="Número de semanas"
        @update:model-value="selectWeeks"
      />
    </div>

    <p class="mt-1 text-sm text-muted">
      Cada semana começa à segunda-feira. A mais recente está em curso.
    </p>

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as semanas"
    />

    <ul
      v-else
      class="mt-5 space-y-4"
    >
      <li
        v-for="week in rows"
        :key="week.week_start"
      >
        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Semana de {{ formatDateLong(week.week_start) }}
            </h2>
          </template>

          <div class="grid gap-5 text-sm sm:grid-cols-2">
            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
                Funil
              </h3>

              <dl class="mt-2 space-y-1">
                <div class="flex justify-between gap-3">
                  <dt>
                    Novos utilizadores
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.new_users }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Viagens publicadas
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.trips_published }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Pedidos de reserva
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.requests }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Pagamentos confirmados
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.paid }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Aceites pelo condutor
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.accepted }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Concluídos
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.completed }}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
                Dinheiro
              </h3>

              <dl class="mt-2 space-y-1">
                <div class="flex justify-between gap-3">
                  <dt>
                    Volume pago
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ formatKz(week.gmv_kz) }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Taxa de serviço
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ formatKz(week.fee_kz) }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Reembolsos
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ formatKz(week.refunds_kz) }}
                  </dd>
                </div>
              </dl>

              <h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                Cancelamentos
              </h3>

              <dl class="mt-2 space-y-1">
                <div class="flex justify-between gap-3">
                  <dt>
                    Pelo passageiro
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.cancelled_by_passenger }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Pelo condutor
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.cancelled_by_driver }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Pela plataforma
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ week.cancelled_by_system }}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
                Tempos médios
              </h3>

              <dl class="mt-2 space-y-1">
                <div class="flex justify-between gap-3">
                  <dt>
                    Resposta do condutor a pedidos
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ hours(week.driver_response_hours) }}
                  </dd>
                </div>

                <div class="flex justify-between gap-3">
                  <dt>
                    Decisão de verificações
                  </dt>

                  <dd class="font-medium tabular-nums">
                    {{ hours(week.verification_hours) }}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-muted">
                Rotas com mais reservas pagas
              </h3>

              <ol
                v-if="week.top_routes.length"
                class="mt-2 space-y-1"
              >
                <li
                  v-for="topRoute in week.top_routes"
                  :key="`${topRoute.origin}-${topRoute.destination}`"
                  class="flex justify-between gap-3"
                >
                  <span>{{ placeName(topRoute.origin) }} para {{ placeName(topRoute.destination) }}</span>

                  <span class="font-medium tabular-nums">{{ topRoute.paid }}</span>
                </li>
              </ol>

              <p
                v-else
                class="mt-2 text-muted"
              >
                Sem reservas pagas.
              </p>
            </section>
          </div>
        </UCard>
      </li>
    </ul>
  </div>
</template>
