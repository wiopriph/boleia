<script setup lang="ts">
import type { SearchParams } from '~/composables/useSearch';


const props = withDefaults(defineProps<{
  initial?: Partial<SearchParams>
  isCompact?: boolean
}>(), { initial: () => ({}), isCompact: false });

const { cities, ensureLoaded } = usePlaces();

await ensureLoaded();

const today = toLuandaDateString();

const state = reactive<{ from: string | undefined, to: string | undefined, date: string, seats: number }>({
  from: props.initial.from,
  to: props.initial.to,
  date: props.initial.date ?? today,
  seats: props.initial.seats ?? 1,
});

watch(() => props.initial, (next) => {
  state.from = next.from;
  state.to = next.to;
  state.date = next.date ?? today;
  state.seats = next.seats ?? 1;
}, { deep: true });

// aliases ("LAD", "Lobito") are searchable without showing up in the label
const placeItems = computed(() => cities.value.map(place => ({
  label: place.name,
  value: place.slug,
  description: place.province !== place.name ? place.province : undefined,
  keywords: [place.name, place.province, ...(place.aliases ?? [])].join(' '),
})));

const seatItems = Array.from({ length: MAX_SEATS }, (_, index) => ({
  label: seatsLabel(index + 1),
  value: index + 1,
}));

const errorText = ref<string | null>(null);

function swap() {
  [state.from, state.to] = [state.to, state.from];
}

function submit() {
  errorText.value = null;

  if (!state.from || !state.to) {
    errorText.value = 'Escolha a origem e o destino.';

    return;
  }

  if (state.from === state.to) {
    errorText.value = 'A origem e o destino têm de ser diferentes.';

    return;
  }

  navigateTo({
    path: '/pesquisa',
    query: toSearchQuery({ from: state.from, to: state.to, date: state.date || today, seats: state.seats }),
  });
}
</script>

<template>
  <form
    class="grid gap-3"
    :class="isCompact ? 'sm:grid-cols-[1fr_auto_1fr_10rem_8rem_auto]' : 'sm:grid-cols-2'"
    @submit.prevent="submit"
  >
    <UFormField
      :label="isCompact ? undefined : 'De'"
      class="min-w-0"
    >
      <UInputMenu
        v-model="state.from"
        :items="placeItems"
        valueKey="value"
        :filterFields="['label', 'keywords']"
        placeholder="Cidade de partida"
        icon="i-lucide-circle-dot"
        size="xl"
        class="w-full"
        :ui="{ content: 'min-w-64' }"
      />
    </UFormField>

    <div
      class="flex items-end justify-center"
      :class="isCompact ? '' : 'sm:order-none -my-2 sm:hidden'"
    >
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left-right"
        aria-label="Trocar origem e destino"
        @click="swap"
      />
    </div>

    <UFormField
      :label="isCompact ? undefined : 'Para'"
      class="min-w-0"
    >
      <UInputMenu
        v-model="state.to"
        :items="placeItems"
        valueKey="value"
        :filterFields="['label', 'keywords']"
        placeholder="Cidade de chegada"
        icon="i-lucide-map-pin"
        size="xl"
        class="w-full"
        :ui="{ content: 'min-w-64' }"
      />
    </UFormField>

    <UFormField :label="isCompact ? undefined : 'Data'">
      <UInput
        v-model="state.date"
        type="date"
        :min="today"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="isCompact ? undefined : 'Lugares'">
      <USelect
        v-model="state.seats"
        :items="seatItems"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <div class="flex items-end sm:col-span-full sm:justify-end">
      <UButton
        type="submit"
        size="xl"
        icon="i-lucide-search"
        :block="!isCompact"
      >
        Pesquisar
      </UButton>
    </div>

    <p
      v-if="errorText"
      class="text-sm text-error sm:col-span-full"
    >
      {{ errorText }}
    </p>
  </form>
</template>
