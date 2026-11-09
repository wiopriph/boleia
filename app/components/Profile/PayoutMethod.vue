<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { PayoutMethod } from '~~/types/rpc';


const props = defineProps<{ current: PayoutMethod | null }>();

const { update } = useProfile();
const { messageFor } = useBoleiaError();
const toast = useToast();

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mcx_express'),
    phone: z.string().refine(value => normalizeLocalPhone(value) !== null, 'Indique um número angolano com 9 dígitos'),
  }),
  z.object({
    type: z.literal('iban'),
    iban: z.string().transform(value => value.replace(/\s+/g, '').toUpperCase())
      .refine(value => /^AO\d{23}$/.test(value), 'O IBAN angolano tem 25 caracteres e começa por AO'),
    bank: z.string().trim()
      .min(2, 'Indique o banco'),
  }),
]);

type Form = z.input<typeof schema>;

const state = reactive<{ type: 'mcx_express' | 'iban', phone: string, iban: string, bank: string }>({
  type: props.current?.type ?? 'mcx_express',
  phone: props.current?.type === 'mcx_express' ? props.current.phone.replace(/^\+244/, '') : '',
  iban: props.current?.type === 'iban' ? props.current.iban : '',
  bank: props.current?.type === 'iban' ? props.current.bank : '',
});

const typeItems = [
  {
    value: 'mcx_express',
    label: 'Multicaixa Express',
    description: 'Transferência para o número de telemóvel associado à app.',
  },
  { value: 'iban', label: 'Conta bancária (IBAN)', description: 'Transferência bancária para o seu IBAN.' },
];

const isPending = ref(false);
const formError = ref<string | null>(null);

async function onSubmit(event: FormSubmitEvent<Form>) {
  formError.value = null;
  isPending.value = true;

  try {
    const data = schema.parse(event.data);
    const payoutMethod: PayoutMethod = data.type === 'mcx_express' ?
      {
        type: 'mcx_express',
        phone: `+${toAuthPhone(normalizeLocalPhone(data.phone)!)}`,
      } :
      {
        type: 'iban',
        iban: data.iban,
        bank: data.bank,
      };

    await update({ payout_method: payoutMethod });

    toast.add({
      title: 'Método de levantamento guardado',
      color: 'success',
      icon: 'i-lucide-check',
    });
  } catch (error) {
    formError.value = messageFor(error);
  } finally {
    isPending.value = false;
  }
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-5"
    @submit="onSubmit"
  >
    <URadioGroup
      v-model="state.type"
      :items="typeItems"
      variant="card"
      size="lg"
    />

    <UFormField
      v-if="state.type === 'mcx_express'"
      label="Número Multicaixa Express"
      name="phone"
      help="Normalmente é o mesmo número da sua conta."
    >
      <UInput
        v-model="state.phone"
        type="tel"
        inputmode="numeric"
        placeholder="923 456 789"
        size="lg"
        class="w-full"
        :ui="{ base: 'ps-16' }"
      >
        <template #leading>
          <span class="text-muted">+244</span>
        </template>
      </UInput>
    </UFormField>

    <template v-else>
      <UFormField
        label="IBAN"
        name="iban"
      >
        <UInput
          v-model="state.iban"
          placeholder="AO06 0000 0000 0000 0000 0000 0"
          size="lg"
          class="w-full font-mono"
          autocapitalize="characters"
        />
      </UFormField>

      <UFormField
        label="Banco"
        name="bank"
      >
        <UInput
          v-model="state.bank"
          placeholder="BAI, BFA, BIC..."
          size="lg"
          class="w-full"
        />
      </UFormField>
    </template>

    <UAlert
      v-if="formError"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :description="formError"
    />

    <UButton
      type="submit"
      size="lg"
      :loading="isPending"
    >
      Guardar
    </UButton>
  </UForm>
</template>
