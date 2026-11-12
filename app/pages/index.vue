<script setup lang="ts">
useSeoMeta({
  title: 'Boleias entre cidades em Angola',
  description: 'Encontre e reserve boleias entre cidades de Angola. Pagamento protegido com Multicaixa Express, condutores verificados.',
});
</script>

<template>
  <div>
    <section class="relative isolate overflow-hidden border-b border-default bg-default">
      <picture
        class="pointer-events-none absolute inset-x-0 top-0 -z-20 h-88 sm:h-full"
        aria-hidden="true"
      >
        <source
          media="(max-width: 767px)"
          srcset="/images/angola-road-mobile.webp"
        >

        <img
          src="/images/angola-road.webp"
          alt=""
          width="1536"
          height="1024"
          fetchpriority="high"
          decoding="async"
          class="h-full w-full object-cover object-[75%_60%] sm:object-[center_60%]"
        >
      </picture>

      <div
        class="home-hero-scrim pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      <UContainer class="pb-8 pt-10 sm:pb-12 sm:pt-16">
        <div class="relative flex min-h-64 items-center">
          <div class="relative z-10 max-w-2xl pb-8 sm:pb-10">
            <p class="eyebrow mb-4">
              O teu caminho, em companhia
            </p>

            <h1 class="text-[2rem] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-5xl">
              Viaja melhor.<br>

              <span class="text-primary">Partilha a boleia.</span>
            </h1>

            <p class="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Encontra quem vai na mesma direcção.<br class="hidden sm:block"> Boleias entre cidades de Angola, com pagamento protegido.
            </p>
          </div>
        </div>

        <div class="relative rounded-card border border-default bg-default p-4 sm:p-5">
          <SearchForm isCompact />
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
          <p class="flex items-center gap-2 text-muted">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 shrink-0 text-primary"
            /> O teu pagamento protegido até ao destino.
          </p>

          <NuxtLink
            to="/publicar"
            class="inline-flex min-h-10 items-center gap-2 font-semibold text-primary hover:underline"
          >
            Vais de carro? Oferece boleia <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4"
            />
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <UContainer class="space-y-12 py-10 sm:space-y-16 sm:py-14">
      <HomePopularRoutes />

      <HomePaymentProtected />

      <section class="flex flex-col items-start justify-between gap-6 rounded-card border border-default bg-default p-6 sm:flex-row sm:items-center sm:p-8">
        <div class="flex items-start gap-4">
          <span class="flex size-12 shrink-0 items-center justify-center rounded-control bg-accent-soft"><UIcon
            name="i-lucide-car-front"
            class="size-6 text-default"
          /></span>

          <div>
            <h2 class="section-title">
              Um caminho. Menos custos.
            </h2>

            <p class="mt-2 text-sm leading-relaxed text-muted">
              Partilha os lugares livres e divide os custos da viagem.
            </p>
          </div>
        </div>

        <UButton
          to="/publicar"
          variant="outline"
          size="lg"
          trailingIcon="i-lucide-arrow-right"
          class="w-full shrink-0 sm:w-auto"
        >
          Oferecer boleia
        </UButton>
      </section>
    </UContainer>
  </div>
</template>
