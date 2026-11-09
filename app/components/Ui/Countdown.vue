<script setup lang="ts">
const props = defineProps<{ until: string | null }>();
const emit = defineEmits<{ expired: [] }>();

const remainingMs = ref(0);

let didEmit = false;

function tick() {
  if (!props.until) {
    remainingMs.value = 0;

    return;
  }

  remainingMs.value = Math.max(0, new Date(props.until).getTime() - Date.now());

  if (remainingMs.value === 0 && !didEmit) {
    didEmit = true;
    emit('expired');
  }
}

watch(() => props.until, () => {
  didEmit = false;
  tick();
}, { immediate: true });

useIntervalFn(tick, 1000);

const text = computed(() => {
  const totalSeconds = Math.floor(remainingMs.value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});
</script>

<template>
  <span class="tabular-nums">{{ text }}</span>
</template>
