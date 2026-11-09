<script setup lang="ts">
const points = [
  { icon: 'i-lucide-smartphone', title: 'Paga na app Multicaixa Express', text: 'Sem dinheiro vivo. O pagamento é confirmado em minutos.' },
  { icon: 'i-lucide-shield-check', title: 'O dinheiro fica protegido', text: 'A Boleia guarda o valor até ao fim da viagem. O condutor só recebe depois de chegar.' },
  { icon: 'i-lucide-undo-2', title: 'Reembolso se algo falhar', text: 'Se o condutor cancelar ou não aparecer, devolvemos tudo.' },
];
</script>

<template>
  <section class="rounded-xl bg-elevated p-5">
    <h2 class="text-lg font-semibold">
      Pagamento protegido
    </h2>

    <ul class="mt-4 grid gap-4 sm:grid-cols-3">
      <li
        v-for="point in points"
        :key="point.title"
        class="flex gap-3"
      >
        <UIcon
          :name="point.icon"
          class="mt-0.5 size-6 shrink-0 text-primary"
        />

        <div>
          <p class="font-medium">
            {{ point.title }}
          </p>

          <p class="text-sm text-muted">
            {{ point.text }}
          </p>
        </div>
      </li>
    </ul>

    <NuxtLink
      to="/pagamentos-e-reembolsos"
      class="mt-4 inline-block text-sm text-primary underline"
    >
      Como funcionam os pagamentos e reembolsos
    </NuxtLink>
  </section>
</template>
