<script setup lang="ts">
import type { Bucket } from '~/composables/useUpload';


const props = withDefaults(defineProps<{
  bucket: Bucket
  shape?: 'circle' | 'rect'
  label?: string
  emptyLabel?: string
  alt?: string
}>(), {
  shape: 'rect',
  label: 'Alterar fotografia',
  emptyLabel: 'Adicionar fotografia',
  alt: '',
});

const model = defineModel<string | null>({ default: null });
const emit = defineEmits<{ uploaded: [url: string] }>();

const { upload } = useUpload();
const { toastError } = useBoleiaError();
const input = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (!file) {
    return;
  }

  isUploading.value = true;

  try {
    const { publicUrl } = await upload(props.bucket, file);

    model.value = publicUrl;

    if (publicUrl) {
      emit('uploaded', publicUrl);
    }
  } catch (error) {
    await toastError(error);
  } finally {
    isUploading.value = false;

    if (input.value) {
      input.value.value = '';
    }
  }
}
</script>

<template>
  <div class="flex items-center gap-4">
    <UAvatar
      v-if="shape === 'circle'"
      :src="model ?? undefined"
      :alt="alt"
      icon="i-lucide-user-round"
      class="size-20 text-2xl"
    />

    <div
      v-else
      class="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated"
    >
      <img
        v-if="model"
        :src="model"
        :alt="alt"
        class="h-full w-full object-cover"
      >

      <UIcon
        v-else
        name="i-lucide-image"
        class="size-8 text-muted"
      />
    </div>

    <div class="flex flex-col gap-1">
      <UButton
        variant="soft"
        color="neutral"
        icon="i-lucide-camera"
        :loading="isUploading"
        @click="input?.click()"
      >
        {{ model ? label : emptyLabel }}
      </UButton>

      <p class="text-xs text-muted">
        JPG, PNG ou WebP. Comprimimos antes de enviar.
      </p>
    </div>

    <input
      ref="input"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFile"
    >
  </div>
</template>
