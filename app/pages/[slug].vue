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
  <UiPage v-if="page">
    <UiPageHeader
      :title="page.title"
      :description="page.description"
    />

    <UiSplit class="mt-6">
      <ContentRenderer
        :value="page"
        class="rounded-card border border-default bg-default p-5 sm:p-8"
      />

      <template #aside>
        <UCard>
          <h2 class="card-title">
            Informações e ajuda
          </h2>

          <nav
            aria-label="Informações e ajuda"
            class="-mx-2 mt-3 space-y-1"
          >
            <UButton
              v-for="link in HELP_PAGES"
              :key="link.to"
              :to="link.to"
              :icon="link.icon"
              :variant="link.to === path ? 'soft' : 'ghost'"
              :color="link.to === path ? 'primary' : 'neutral'"
              :aria-current="link.to === path ? 'page' : undefined"
              class="w-full justify-start"
            >
              {{ link.label }}
            </UButton>
          </nav>
        </UCard>
      </template>
    </UiSplit>
  </UiPage>
</template>
