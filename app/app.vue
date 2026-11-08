<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'pt-AO' },
  titleTemplate: title => (title ? `${title} | Boleia` : 'Boleia'),
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
