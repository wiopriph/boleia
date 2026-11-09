<script setup lang="ts">
import type { TimeOfDay } from '~/utils/trip';


const props = defineProps<{ prices: number[] }>();

const times = defineModel<TimeOfDay[]>('times', { default: () => [] });
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
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      v-for="option in TIME_OF_DAY_OPTIONS"
      :key="option.value"
      size="sm"
      :variant="times.includes(option.value) ? 'solid' : 'outline'"
      :color="times.includes(option.value) ? 'primary' : 'neutral'"
      :title="option.hint"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </UButton>

    <USelect
      v-model="maxPrice"
      :items="priceItems"
      size="sm"
      class="ms-auto w-44"
      icon="i-lucide-banknote"
    />
  </div>
</template>
