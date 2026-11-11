<script setup lang="ts">
const email = useRuntimeConfig().public.supportEmail;
</script>

<template>
  <p v-if="email">
    Escreva-nos para
    <a
      :href="`mailto:${email}`"
      class="font-medium text-primary"
    >{{ email }}</a>.
  </p>

  <p v-else>
    O endereço de e-mail do apoio será publicado aqui em breve.
  </p>
</template>
