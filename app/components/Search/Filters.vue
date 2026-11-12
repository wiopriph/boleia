<script setup lang="ts">
import type { TimeOfDay } from '~/utils/trip';


const props = defineProps<{ prices: number[] }>();

const times = defineModel<TimeOfDay[]>('times', { default: () => [] });
const isOpen = ref(false);

const maxPrice = defineModel<number | null>('maxPrice', { default: null });

function toggle(value: TimeOfDay) {
  times.value = times.value.includes(value) ?
    times.value.filter(item => item !== value) :
    [...times.value, value];
}

// thresholds come from the loaded prices, so the list never offers an empty result
const priceItems = computed(() => {
  const unique = [...new Set(props.prices)].sort((left, right) => left - right);
  const steps = unique.length > 5 ?
    [0.25, 0.5, 0.75, 1].map(fraction => unique[Math.min(unique.length - 1, Math.ceil(unique.length * fraction) - 1)]!) :
    unique;

  return [
    { label: 'Qualquer preço', value: null as number | null },
    ...[...new Set(steps)].map(price => ({ label: `Até ${formatKz(price)}`, value: price as number | null })),
  ];
});
</script>

<template>
  <section class="rounded-card border border-default bg-default p-5">
    <div class="flex items-center justify-between gap-3">
      <h2 class="card-title flex items-center gap-2">
        <UIcon
          name="i-lucide-sliders-horizontal"
          class="size-4 text-primary"
        /> Filtros
      </h2>

      <UButton
        class="lg:hidden"
        variant="ghost"
        color="neutral"
        :icon="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        :aria-expanded="isOpen"
        aria-label="Mostrar ou ocultar filtros"
        @click="isOpen = !isOpen"
      />
    </div>

    <div
      class="mt-5 space-y-6"
      :class="isOpen ? '' : 'hidden lg:block'"
    >
      <fieldset class="space-y-3">
        <legend class="mb-3 text-sm font-semibold">
          Horário de partida
        </legend>

        <UCheckbox
          v-for="option in TIME_OF_DAY_OPTIONS"
          :key="option.value"
          :modelValue="times.includes(option.value)"
          :label="option.label"
          :description="option.hint"
          :ui="{ root: 'min-h-11' }"
          @update:model-value="toggle(option.value)"
        />
      </fieldset>

      <USeparator />

      <UFormField label="Preço por lugar">
        <USelect
          v-model="maxPrice"
          :items="priceItems"
          class="w-full"
          icon="i-lucide-banknote"
        />
      </UFormField>
    </div>
  </section>
</template>
