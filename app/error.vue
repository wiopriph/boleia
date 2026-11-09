<script setup lang="ts">
import type { NuxtError } from '#app';


const props = defineProps<{ error: NuxtError }>();

const isNotFound = computed(() => props.error.statusCode === 404);
</script>

<template>
  <UApp>
    <UContainer class="flex min-h-screen flex-col items-center justify-center gap-4 py-16 text-center">
      <p class="text-6xl font-semibold text-muted">
        {{ error.statusCode }}
      </p>

      <h1 class="text-xl font-semibold">
        {{ isNotFound ? 'Página não encontrada' : 'Algo correu mal' }}
      </h1>

      <p class="max-w-sm text-muted">
        {{ isNotFound ? 'O endereço pode estar errado ou a página já não existe.' : 'Tente novamente dentro de alguns instantes.' }}
      </p>

      <UButton
        size="lg"
        @click="clearError({ redirect: '/' })"
      >
        Voltar ao início
      </UButton>
    </UContainer>
  </UApp>
</template>
