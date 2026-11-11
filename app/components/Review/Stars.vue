<script setup lang="ts">
const props = withDefaults(defineProps<{ rating: number, isInput?: boolean }>(), { isInput: false });
const emit = defineEmits<{ 'update:rating': [value: number] }>();

const STAR_COUNT = 5;
const stars = Array.from({ length: STAR_COUNT }, (_, index) => index + 1);

function choose(value: number) {
  if (props.isInput) {
    emit('update:rating', value);
  }
}
</script>

<template>
  <div
    class="inline-flex items-center"
    :class="isInput ? 'gap-2' : 'gap-0.5'"
    :role="isInput ? 'radiogroup' : 'img'"
    :aria-label="isInput ? 'Avaliação de 1 a 5 estrelas' : `${rating} de ${STAR_COUNT} estrelas`"
  >
    <component
      :is="isInput ? 'button' : 'span'"
      v-for="star in stars"
      :key="star"
      :type="isInput ? 'button' : undefined"
      :role="isInput ? 'radio' : undefined"
      :aria-checked="isInput ? star === rating : undefined"
      :aria-label="isInput ? `${star} estrelas` : undefined"
      class="leading-none"
      :class="isInput ? 'cursor-pointer rounded-md p-1 focus-visible:outline-2 focus-visible:outline-primary' : ''"
      @click="choose(star)"
    >
      <UIcon
        name="i-lucide-star"
        :class="[
          isInput ? 'size-9' : 'size-4',
          star <= rating ? 'fill-current text-warning' : 'text-muted',
        ]"
      />
    </component>
  </div>
</template>
