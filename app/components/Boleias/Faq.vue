<script setup lang="ts">
defineProps<{ items: { question: string, answer: string }[] }>();
</script>

<template>
  <section>
    <h2 class="text-lg font-semibold">
      Perguntas frequentes
    </h2>

    <dl class="mt-3 divide-y divide-default">
      <div
        v-for="item in items"
        :key="item.question"
        class="py-3"
      >
        <dt class="font-medium">
          {{ item.question }}
        </dt>

        <dd class="mt-1 text-sm text-muted">
          {{ item.answer }}
        </dd>
      </div>
    </dl>

    <p class="mt-3 text-sm">
      <NuxtLink
        to="/faq"
        class="font-medium text-primary"
      >
        Todas as perguntas
      </NuxtLink>
    </p>
  </section>
</template>
