<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Profile } from '~/composables/useProfile';


const props = defineProps<{ profile: Profile, isOnboarding?: boolean }>();
const emit = defineEmits<{ saved: [] }>();

const { update } = useProfile();
const { messageFor } = useBoleiaError();
const toast = useToast();

const currentYear = new Date().getFullYear();
const schema = z.object({
  display_name: z.string().trim()
    .min(2, 'O nome tem de ter pelo menos 2 caracteres')
    .max(40, 'No máximo 40 caracteres'),
  birth_year: z.number().int()
    .min(1920, 'Ano inválido')
    .max(currentYear - 18, 'Tem de ter 18 anos ou mais')
    .optional(),
  bio: z.string().trim()
    .max(300, 'No máximo 300 caracteres')
    .optional(),
});

type Form = z.output<typeof schema>;

const state = reactive<Form>({
  display_name: props.profile.display_name,
  birth_year: props.profile.birth_year ?? undefined,
  bio: props.profile.bio ?? undefined,
});
const avatarUrl = ref<string | null>(props.profile.avatar_url);

const isPending = ref(false);
const formError = ref<string | null>(null);

// the photo is saved as soon as it is uploaded, so a dropped connection never loses it
async function onAvatar(url: string) {
  try {
    await update({ avatar_url: url });
  } catch (error) {
    formError.value = messageFor(error);
  }
}

async function onSubmit(event: FormSubmitEvent<Form>) {
  formError.value = null;
  isPending.value = true;

  try {
    await update({
      display_name: event.data.display_name,
      ...(props.isOnboarding ?
        {} :
        {
          birth_year: event.data.birth_year,
          bio: event.data.bio ?? '',
        }),
    });

    toast.add({
      title: 'Perfil guardado',
      color: 'success',
      icon: 'i-lucide-check',
    });

    emit('saved');
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
    class="measure-form space-y-5"
    @submit="onSubmit"
  >
    <UFormField
      label="Fotografia"
      :help="isOnboarding ? 'Os condutores e passageiros vêem a sua fotografia antes de aceitar.' : undefined"
    >
      <UiPhotoUpload
        v-model="avatarUrl"
        bucket="avatars"
        shape="circle"
        :alt="state.display_name"
        @uploaded="onAvatar"
      />
    </UFormField>

    <UFormField
      label="Nome"
      name="display_name"
      help="Como aparece aos outros: primeiro nome e inicial, por exemplo Ana R."
    >
      <UInput
        v-model="state.display_name"
        size="lg"
        class="w-full"
        autocomplete="name"
        maxlength="40"
      />
    </UFormField>

    <template v-if="!isOnboarding">
      <UFormField
        label="Ano de nascimento"
        name="birth_year"
        help="Mostramos apenas a faixa etária."
      >
        <UInputNumber
          v-model="state.birth_year"
          :min="1920"
          :max="currentYear - 18"
          :formatOptions="{ useGrouping: false }"
          size="lg"
          class="w-full sm:w-48"
        />
      </UFormField>

      <UFormField
        label="Sobre si"
        name="bio"
        help="Opcional, até 300 caracteres."
      >
        <UTextarea
          v-model="state.bio"
          :rows="3"
          maxlength="300"
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
      :block="isOnboarding"
      :loading="isPending"
    >
      {{ isOnboarding ? 'Continuar' : 'Guardar' }}
    </UButton>
  </UForm>
</template>
