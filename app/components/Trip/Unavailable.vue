<template>
  <UContainer class="flex flex-col items-center gap-4 py-20 text-center">
    <UIcon
      name="i-lucide-car-front"
      class="size-10 text-muted"
    />

    <div>
      <h1 class="page-title">
        Esta viagem já não está disponível
      </h1>

      <p class="mt-1 text-muted">
        Pode ter partido, sido cancelada ou a ligação está errada.
      </p>
    </div>

    <UButton
      to="/"
      icon="i-lucide-search"
    >
      Procurar outra boleia
    </UButton>
  </UContainer>
</template>
