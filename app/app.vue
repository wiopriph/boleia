<script setup lang="ts">
import { pt } from '@nuxt/ui/locale';


useHead({
  htmlAttrs: { lang: 'pt-AO' },
  titleTemplate: title => (title ? `${title} | Boleia` : 'Boleia'),
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
});
</script>

<template>
  <UApp
    :locale="pt"
    :toaster="{ position: 'top-center' }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
