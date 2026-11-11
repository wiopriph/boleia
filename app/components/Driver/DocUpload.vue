<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  hint: string
  icon: string
  canBePdf?: boolean
}>(), { canBePdf: false });

// "<uid>/<file>" in the verifications bucket, as submit_verification expects
const path = defineModel<string | null>({ default: null });

const { upload } = useUpload();
const { previewUrl } = useDriverVerification();
const { messageFor } = useBoleiaError();

const DOC_MAX_SIDE = 2000;

const input = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const errorText = ref<string | null>(null);
const preview = ref<string | null>(null);
const isPdf = computed(() => !!path.value?.endsWith('.pdf'));

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (!file) {
    return;
  }

  isUploading.value = true;
  errorText.value = null;

  try {
    // documents keep more pixels than avatars so the text stays readable for the moderator
    const result = await upload('verifications', file, { maxSide: DOC_MAX_SIDE, allowPdf: props.canBePdf });

    path.value = result.path;
    preview.value = result.path.endsWith('.pdf') ? null : await previewUrl(result.path);
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isUploading.value = false;

    if (input.value) {
      input.value.value = '';
    }
  }
}
</script>

<template>
  <div class="flex items-center gap-3 py-3">
    <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated">
      <img
        v-if="preview"
        :src="preview"
        :alt="label"
        class="h-full w-full object-cover"
      >

      <UIcon
        v-else
        :name="isPdf ? 'i-lucide-file-text' : icon"
        class="size-6"
        :class="path ? 'text-success' : 'text-muted'"
      />
    </div>

    <div class="min-w-0 flex-1">
      <p class="font-medium">
        {{ label }}
        <UIcon
          v-if="path"
          name="i-lucide-circle-check"
          class="size-4 align-text-bottom text-success"
          aria-label="Enviado"
        />
      </p>

      <p class="text-sm text-muted">
        {{ path ? 'Enviado. Pode substituir se a imagem não estiver legível.' : hint }}
      </p>

      <p
        v-if="errorText"
        class="text-sm text-error"
      >
        {{ errorText }}
      </p>
    </div>

    <UButton
      :variant="path ? 'ghost' : 'soft'"
      color="neutral"
      :icon="path ? 'i-lucide-refresh-cw' : 'i-lucide-upload'"
      :loading="isUploading"
      :aria-label="path ? `Substituir ${label}` : `Enviar ${label}`"
      @click="input?.click()"
    >
      {{ path ? 'Substituir' : 'Enviar' }}
    </UButton>

    <input
      ref="input"
      type="file"
      :accept="canBePdf ? 'image/*,application/pdf' : 'image/*'"
      class="hidden"
      @change="onFile"
    >
  </div>
</template>
