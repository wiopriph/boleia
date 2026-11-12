<script setup lang="ts">
import type { RotasCollectionItem } from '@nuxt/content';
import type { RouteStat } from '~/composables/useRoutePages';
import type { TripRow } from '~/composables/useSearch';


const props = defineProps<{
  stat: RouteStat
  trips: TripRow[]
  reverse: RouteStat | null
  otherRoutes: RouteStat[]
  text: RotasCollectionItem | null
}>();

const title = computed(() => routeTitle(props.stat));
const duration = computed(() => formatDuration(props.stat.minutes));

const searchInitial = computed(() => ({
  from: props.stat.origin_slug,
  to: props.stat.destination_slug,
  date: props.stat.next_departure_at ? toLuandaDateString(props.stat.next_departure_at) : undefined,
}));

const facts = computed(() => {
  const items: { label: string, value: string }[] = [];

  if (props.stat.trips_upcoming && props.stat.min_price_kz) {
    items.push({ label: 'Preço por lugar', value: `desde ${formatKz(props.stat.min_price_kz)}` });
  } else if (props.stat.price_hint_kz) {
    items.push({ label: 'Preço habitual por lugar', value: `cerca de ${formatKz(props.stat.price_hint_kz)}` });
  }

  if (duration.value) {
    items.push({ label: 'Duração de carro', value: `cerca de ${duration.value}` });
  }

  items.push({ label: 'Viagens marcadas', value: String(props.stat.trips_upcoming ?? 0) });
  items.push({ label: 'Viagens em 30 dias', value: String(props.stat.trips_30d ?? 0) });

  return items;
});

const faq = computed(() => {
  const items: { question: string, answer: string }[] = [];
  const feeNote = 'Ao preço junta-se a taxa de serviço, mostrada antes de pagar.';

  if (props.stat.trips_upcoming && props.stat.min_price_kz) {
    items.push({
      question: `Quanto custa uma boleia ${title.value}?`,
      answer: `As viagens marcadas custam desde ${formatKz(props.stat.min_price_kz)} por lugar. ${feeNote}`,
    });
  } else if (props.stat.price_hint_kz) {
    items.push({
      question: `Quanto custa uma boleia ${title.value}?`,
      answer: `O preço habitual nesta rota é de cerca de ${formatKz(props.stat.price_hint_kz)} por lugar. ${feeNote}`,
    });
  }

  if (duration.value) {
    items.push({
      question: 'Quanto tempo demora a viagem?',
      answer: `Cerca de ${duration.value} de carro, sem contar com as paragens.`,
    });
  }

  items.push(
    {
      question: 'Como pago o lugar?',
      answer: 'Com Multicaixa Express, no momento da reserva. O dinheiro fica guardado na Boleia e só passa para o condutor depois da viagem.',
    },
    {
      question: 'Posso cancelar a reserva?',
      answer: 'Sim, até à hora de partida. Mais de 24 horas antes recebe o valor de volta, menos a comissão do meio de pagamento. Menos de 24 horas antes recebe 50 %.',
    },
    {
      question: 'Não há viagem na data que quero. O que faço?',
      answer: 'Os condutores publicam viagens novas todos os dias. Pesquise as datas próximas ou volte a ver mais perto do dia.',
    },
  );

  return items;
});
</script>

<template>
  <div>
    <section class="page-intro">
      <UContainer class="py-6 sm:py-8">
        <NuxtLink
          :to="routePath(stat.origin_slug)"
          class="text-sm text-muted transition-colors hover:text-primary"
        >
          Boleias {{ placeWith('de', stat.origin_slug, stat.origin_name) }}
        </NuxtLink>

        <h1 class="page-title mt-2">
          Boleias {{ title }}
        </h1>

        <dl class="mt-4 flex flex-wrap gap-x-10 gap-y-3">
          <div
            v-for="fact in facts"
            :key="fact.label"
          >
            <dt class="text-xs text-muted">
              {{ fact.label }}
            </dt>

            <dd class="font-semibold">
              {{ fact.value }}
            </dd>
          </div>
        </dl>

        <SearchForm
          :initial="searchInitial"
          class="mt-6"
          isCompact
        />
      </UContainer>
    </section>

    <UiPage>
      <UiSplit>
        <section>
          <h2 class="section-title">
            Próximas viagens
          </h2>

          <BoleiasTripList
            v-if="trips.length"
            :trips="trips"
            class="mt-4"
          />

          <UiEmptyState
            v-else
            class="mt-4"
            icon="i-lucide-car-front"
            title="Ainda não há viagens marcadas nesta rota"
            description="Vai fazer este caminho de carro? Publique a viagem e divida os custos."
          >
            <UButton
              to="/publicar"
              variant="soft"
            >
              Publicar viagem
            </UButton>
          </UiEmptyState>
        </section>

        <section>
          <h2 class="section-title">
            Sobre a viagem {{ title }}
          </h2>

          <div class="measure-text">
            <ContentRenderer
              v-if="text"
              :value="text"
              class="mt-1"
            />

            <p
              v-else
              class="mt-3 leading-relaxed text-muted"
            >
              Na Boleia viaja com condutores que já vão fazer o caminho
              {{ title }}<template v-if="duration">
                , uma viagem de cerca de {{ duration }} de carro
              </template>.
              Reserva o lugar, paga com Multicaixa Express e o dinheiro fica protegido até chegar ao destino.
            </p>
          </div>
        </section>

        <BoleiasFaq :items="faq" />

        <template #aside>
          <HomePaymentProtected isCompact />

          <UCard v-if="reverse || otherRoutes.length">
            <h2 class="card-title">
              Outras rotas
            </h2>

            <NuxtLink
              v-if="reverse"
              :to="routePath(reverse.origin_slug, reverse.destination_slug)"
              class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              <UIcon
                name="i-lucide-arrow-left-right"
                class="size-4 shrink-0"
              />

              Viagem de volta {{ routeTitle(reverse) }}
            </NuxtLink>

            <template v-if="otherRoutes.length">
              <h3 class="group-label mt-5">
                Com partida {{ placeWith('de', stat.origin_slug, stat.origin_name) }}
              </h3>

              <BoleiasRouteList
                :routes="otherRoutes"
                show="destination"
                class="mt-3"
                isStacked
              />
            </template>
          </UCard>
        </template>
      </UiSplit>
    </UiPage>
  </div>
</template>
