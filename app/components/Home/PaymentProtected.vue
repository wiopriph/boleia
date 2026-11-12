<script setup lang="ts">
withDefaults(defineProps<{ isCompact?: boolean }>(), { isCompact: false });

const points = [
  { icon: 'i-lucide-smartphone', title: 'Paga na app Multicaixa Express', text: 'Sem dinheiro vivo. O pagamento é confirmado em minutos.' },
  { icon: 'i-lucide-shield-check', title: 'O dinheiro fica protegido', text: 'A Boleia guarda o valor até ao fim da viagem. O condutor só recebe depois de chegar.' },
  { icon: 'i-lucide-undo-2', title: 'Reembolso se algo falhar', text: 'Se o condutor cancelar ou não aparecer, devolvemos tudo.' },
];
</script>

<template>
  <section :class="isCompact ? 'rounded-card border border-default bg-default p-5' : ''">
    <div :class="isCompact ? '' : 'mb-6 sm:mb-8'">
      <p
        v-if="!isCompact"
        class="eyebrow mb-3"
      >
        Do primeiro passo ao destino
      </p>

      <h2 :class="isCompact ? 'card-title' : 'section-title'">
        Pagamento protegido. Viagem tranquila.
      </h2>
    </div>

    <ul
      class="grid gap-6"
      :class="isCompact ? 'mt-5' : 'sm:grid-cols-3 sm:gap-8'"
    >
      <li
        v-for="point in points"
        :key="point.title"
        :class="isCompact ? 'flex gap-3' : 'flex gap-4 sm:block'"
      >
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary/8"
          :class="isCompact ? '' : 'sm:mb-4'"
        >
          <UIcon
            :name="point.icon"
            class="size-5 text-primary"
          />
        </span>

        <div>
          <h3
            class="text-sm font-semibold"
            :class="isCompact ? '' : 'sm:text-base'"
          >
            {{ point.title }}
          </h3>

          <p class="mt-1.5 text-sm leading-relaxed text-muted">
            {{ point.text }}
          </p>
        </div>
      </li>
    </ul>

    <NuxtLink
      to="/pagamentos-e-reembolsos"
      class="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      Como funciona o pagamento <UIcon
        name="i-lucide-arrow-right"
        class="size-4 shrink-0"
      />
    </NuxtLink>
  </section>
</template>
