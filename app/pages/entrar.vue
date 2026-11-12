<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';


definePageMeta({ middleware: 'guest' });
useSeoMeta({ title: 'Entrar', robots: 'noindex' });

const route = useRoute();
const { sendCode, verifyCode } = useAuth();
const { load, update, profile } = useProfile();
const { messageFor } = useBoleiaError();

const step = ref<'phone' | 'code'>('phone');
const isPending = ref(false);
const formError = ref<string | null>(null);
const localPhone = ref('');

const phoneSchema = z.object({
  phone: z.string().refine(value => normalizeLocalPhone(value) !== null, 'Indique um número angolano com 9 dígitos, por exemplo 923 456 789'),
});
const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'O código tem 6 dígitos'),
});

type PhoneForm = z.output<typeof phoneSchema>;
type CodeForm = z.output<typeof codeSchema>;

const phoneState = reactive<PhoneForm>({ phone: '' });
const codeState = reactive<CodeForm>({ code: '' });
// UPinInput models an array of digits; the form validates the joined string
const pinDigits = ref<string[]>([]);

watch(pinDigits, (digits) => {
  codeState.code = digits.join('');
}, { deep: true });

// resend cooldown mirrors GoTrue's per-number limit
const RESEND_SECONDS = 60;
const resendIn = ref(0);
const { pause, resume } = useIntervalFn(() => {
  if (resendIn.value > 0) {
    resendIn.value -= 1;
  } else {
    pause();
  }
}, 1000, { immediate: false });

function startCooldown() {
  resendIn.value = RESEND_SECONDS;
  resume();
}

async function onPhone(event: FormSubmitEvent<PhoneForm>) {
  formError.value = null;
  isPending.value = true;

  try {
    localPhone.value = normalizeLocalPhone(event.data.phone)!;
    await sendCode(localPhone.value);
    step.value = 'code';
    startCooldown();
  } catch (error) {
    formError.value = messageFor(error);
  } finally {
    isPending.value = false;
  }
}

async function resend() {
  if (resendIn.value > 0) {
    return;
  }

  formError.value = null;

  try {
    await sendCode(localPhone.value);
    startCooldown();
  } catch (error) {
    formError.value = messageFor(error);
  }
}

async function onCode(event: FormSubmitEvent<CodeForm>) {
  formError.value = null;
  isPending.value = true;

  try {
    const signedIn = await verifyCode(localPhone.value, event.data.code);

    await load(true, signedIn?.id);

    // consent is given by continuing past the text under the button; recorded once (spec sections 8, 15)
    if (profile.value && !(profile.value.terms_accepted_at && profile.value.adult_confirmed_at)) {
      await update({ terms_accepted: true, adult_confirmed: true });
    }

    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/';

    await navigateTo(redirect);
  } catch (error) {
    formError.value = messageFor(error);
  } finally {
    isPending.value = false;
  }
}

function back() {
  step.value = 'phone';
  codeState.code = '';
  pinDigits.value = [];
  formError.value = null;
}
</script>

<template>
  <UContainer class="max-w-md py-10 sm:py-16">
    <div class="mb-5 flex size-12 items-center justify-center rounded-control bg-primary/10">
      <UIcon
        name="i-lucide-user-round"
        class="size-6 text-primary"
      />
    </div>

    <UiPageHeader
      title="A tua próxima boleia começa aqui."
      description="Entra ou cria a tua conta com o teu número de telemóvel."
    />

    <UForm
      v-if="step === 'phone'"
      :schema="phoneSchema"
      :state="phoneState"
      class="mt-6 space-y-5 rounded-card border border-default bg-default p-5 sm:p-6"
      @submit="onPhone"
    >
      <UFormField
        label="Número de telemóvel"
        name="phone"
        help="Enviamos um código por SMS para este número."
      >
        <UInput
          v-model="phoneState.phone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel-national"
          placeholder="923 456 789"
          size="xl"
          class="w-full"
          :ui="{ base: 'ps-16' }"
        >
          <template #leading>
            <span class="text-base text-muted">+244</span>
          </template>
        </UInput>
      </UFormField>

      <UAlert
        v-if="formError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="formError"
      />

      <UButton
        type="submit"
        size="xl"
        block
        :loading="isPending"
      >
        Enviar código
      </UButton>

      <p class="text-center text-sm text-muted">
        Ao continuar, confirma que tem 18 anos ou mais e aceita as
        <NuxtLink
          to="/regras"
          class="underline"
        >
          Regras
        </NuxtLink>
        e as recomendações de
        <NuxtLink
          to="/seguranca"
          class="underline"
        >
          Segurança
        </NuxtLink>
      </p>
    </UForm>

    <UForm
      v-else
      :schema="codeSchema"
      :state="codeState"
      class="mt-6 space-y-5 rounded-card border border-default bg-default p-5 sm:p-6"
      @submit="onCode"
    >
      <p class="text-muted">
        Enviámos um código de 6 dígitos para <span class="font-medium text-default">{{ formatPhone(toAuthPhone(localPhone)) }}</span>.
      </p>

      <UFormField
        label="Código"
        name="code"
      >
        <UPinInput
          v-model="pinDigits"
          :length="6"
          otp
          size="lg"
          :ui="{ root: 'gap-1.5', base: 'w-8 min-[375px]:w-9' }"
          autofocus
        />
      </UFormField>

      <UAlert
        v-if="formError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="formError"
      />

      <UButton
        type="submit"
        size="xl"
        block
        :loading="isPending"
      >
        Confirmar
      </UButton>

      <div class="flex items-center justify-between text-sm">
        <UButton
          variant="link"
          color="neutral"
          icon="i-lucide-arrow-left"
          @click="back"
        >
          Outro número
        </UButton>

        <UButton
          variant="link"
          color="neutral"
          :disabled="resendIn > 0"
          @click="resend"
        >
          {{ resendIn > 0 ? `Reenviar em ${resendIn} s` : 'Reenviar código' }}
        </UButton>
      </div>
    </UForm>
  </UContainer>
</template>
