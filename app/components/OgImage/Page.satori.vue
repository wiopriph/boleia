<script setup lang="ts">
// Default social image of every page (satori: flex only, fixed spacing, inline colors).
// Long titles shrink so two lines always fit above the footer line.
const props = withDefaults(defineProps<{ title: string, subtitle?: string }>(), { subtitle: '' });

const titleSize = computed(() => (props.title.length > 34 ? '64px' : '80px'));
</script>

<template>
  <div
    class="flex flex-col"
    style="width: 1200px; height: 600px; padding: 64px 72px; background: #ffffff; color: #192b29; font-family: Inter;"
  >
    <div class="flex items-center">
      <span
        class="font-bold"
        style="font-size: 44px; letter-spacing: -2px; color: #087f70;"
      >boleia</span>

      <span
        class="font-bold"
        style="font-size: 44px; color: #f4b544;"
      >.</span>
    </div>

    <div
      class="flex flex-col"
      style="margin-top: 72px;"
    >
      <span
        class="font-bold"
        :style="{ fontSize: titleSize, lineHeight: 1.1, letterSpacing: '-2px' }"
      >{{ title }}</span>

      <span
        v-if="subtitle"
        style="margin-top: 28px; font-size: 34px; line-height: 1.3; color: #60736b;"
      >{{ subtitle }}</span>
    </div>

    <div
      class="flex"
      style="position: absolute; left: 72px; bottom: 56px; font-size: 26px; color: #087f70;"
    >
      Boleias entre cidades de Angola · pagamento protegido
    </div>

    <div
      class="flex"
      style="position: absolute; left: 0; bottom: 0; width: 1200px; height: 12px; background: #087f70;"
    />
  </div>
</template>
