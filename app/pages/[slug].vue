<script setup lang="ts">
const route = useRoute();
const path = `/${String(route.params.slug ?? '')}`;

// static texts live in content/paginas/*.md; any other one-segment path is a 404
const { data: page } = await useAsyncData(`pagina:${path}`, () => queryCollection('paginas').path(path)
  .first());

if (!page.value) {
  throw createError({ statusCode: 404, fatal: true });
}

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
  ogTitle: () => page.value?.title,
  ogDescription: () => page.value?.description,
  ogType: 'article',
});
</script>

<template>
  <UContainer
    v-if="page"
    class="max-w-2xl py-8"
  >
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
      {{ page.title }}
    </h1>

    <p class="mt-2 text-muted">
      {{ page.description }}
    </p>

    <ContentRenderer
      :value="page"
      class="mt-6"
    />
  </UContainer>
</template>
