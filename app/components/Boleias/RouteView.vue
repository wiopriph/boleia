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
    <section class="bg-elevated/50">
      <UContainer class="max-w-3xl py-8">
        <nav class="text-sm text-muted">
          <NuxtLink
            :to="routePath(stat.origin_slug)"
            class="hover:text-default"
          >
            Boleias {{ placeWith('de', stat.origin_slug, stat.origin_name) }}
          </NuxtLink>
        </nav>

        <h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Boleias {{ title }}
        </h1>

        <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

        <UCard class="mt-6">
          <SearchForm :initial="searchInitial" />
        </UCard>
      </UContainer>
    </section>

    <UContainer class="max-w-3xl space-y-10 py-8">
      <section>
        <h2 class="text-lg font-semibold">
          Próximas viagens
        </h2>

        <BoleiasTripList
          v-if="trips.length"
          :trips="trips"
          class="mt-4"
        />

        <div
          v-else
          class="mt-3 rounded-xl border border-dashed border-default p-5 text-sm"
        >
          <p class="font-medium">
            Ainda não há viagens marcadas nesta rota.
          </p>

          <p class="mt-1 text-muted">
            Vai fazer este caminho de carro? Publique a viagem e divida os custos.
          </p>

          <UButton
            to="/publicar"
            color="neutral"
            variant="subtle"
            class="mt-3"
          >
            Publicar viagem
          </UButton>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold">
          Sobre a viagem {{ title }}
        </h2>

        <ContentRenderer
          v-if="text"
          :value="text"
          class="mt-1"
        />

        <p
          v-else
          class="mt-3 text-muted"
        >
          Na Boleia viaja com condutores que já vão fazer o caminho
          {{ title }}<template v-if="duration">
            , uma viagem de cerca de {{ duration }} de carro
          </template>.
          Reserva o lugar, paga com Multicaixa Express e o dinheiro fica protegido até chegar ao destino.
        </p>
      </section>

      <HomePaymentProtected />

      <BoleiasFaq :items="faq" />

      <section v-if="reverse || otherRoutes.length">
        <h2 class="text-lg font-semibold">
          Outras rotas
        </h2>

        <p
          v-if="reverse"
          class="mt-3 text-sm"
        >
          <NuxtLink
            :to="routePath(reverse.origin_slug, reverse.destination_slug)"
            class="font-medium text-primary"
          >
            Viagem de volta: boleias {{ routeTitle(reverse) }}
          </NuxtLink>
        </p>

        <template v-if="otherRoutes.length">
          <h3 class="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Com partida {{ placeWith('de', stat.origin_slug, stat.origin_name) }}
          </h3>

          <BoleiasRouteList
            :routes="otherRoutes"
            show="destination"
            class="mt-3"
          />
        </template>
      </section>
    </UContainer>
  </div>
</template>
