<script setup lang="ts">
useSeoMeta({
  title: 'Boleias entre cidades em Angola',
  description: 'Encontre e reserve boleias entre cidades de Angola. Pagamento protegido com Multicaixa Express, condutores verificados.',
});
</script>

<template>
  <div>
    <section class="bg-elevated/50">
      <UContainer class="py-10 sm:py-16">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          Boleias entre cidades
        </h1>

        <p class="mt-2 max-w-xl text-muted">
          Reserve um lugar com um condutor que já vai fazer a viagem. Paga na Multicaixa Express, o dinheiro fica protegido até chegar.
        </p>

        <UCard class="mt-6">
          <SearchForm />
        </UCard>
      </UContainer>
    </section>

    <UContainer class="space-y-10 py-10">
      <HomePopularRoutes />

      <HomePaymentProtected />
    </UContainer>
  </div>
</template>
