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
    class="relative grid grid-cols-2 items-end gap-3"
    :class="isCompact ? 'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_10rem_8rem_auto]' : ''"
    @submit.prevent="submit"
  >
    <UFormField
      label="Origem"
      class="col-span-2 min-w-0 sm:col-span-1"
    >
      <UInputMenu
        v-model="state.from"
        :items="placeItems"
        valueKey="value"
        :filterFields="['label', 'keywords']"
        placeholder="De onde sais?"
        icon="i-lucide-circle-dot"
        size="xl"
        class="w-full"
        :ui="{ content: 'min-w-64' }"
      />
    </UFormField>

    <div
      class="absolute right-3 top-16 z-10 flex justify-end sm:col-span-1"
      :class="isCompact ? 'sm:hidden lg:static lg:flex' : 'sm:hidden'"
    >
      <UButton
        type="button"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left-right"
        aria-label="Trocar origem e destino"
        class="rounded-full border border-default bg-default p-2 lg:border-0"
        @click="swap"
      />
    </div>

    <UFormField
      label="Destino"
      class="col-span-2 min-w-0 sm:col-span-1"
    >
      <UInputMenu
        v-model="state.to"
        :items="placeItems"
        valueKey="value"
        :filterFields="['label', 'keywords']"
        placeholder="Para onde vais?"
        icon="i-lucide-map-pin"
        size="xl"
        class="w-full"
        :ui="{ content: 'min-w-64' }"
      />
    </UFormField>

    <UFormField
      label="Data"
      class="col-span-2 min-w-0 min-[375px]:col-span-1"
    >
      <UInput
        v-model="state.date"
        type="date"
        :min="today"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Passageiros"
      class="col-span-2 min-w-0 min-[375px]:col-span-1"
    >
      <USelect
        v-model="state.seats"
        :items="seatItems"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      size="xl"
      icon="i-lucide-search"
      class="col-span-2"
      :class="isCompact ? 'lg:col-span-1' : ''"
      block
    >
      Procurar boleia
    </UButton>

    <p
      v-if="errorText"
      role="alert"
      class="col-span-full text-sm text-error"
    >
      {{ errorText }}
    </p>
  </form>
</template>
