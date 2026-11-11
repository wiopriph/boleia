<script setup lang="ts">
const props = defineProps<{ path: string | null, label: string }>();

const { documentUrl } = useAdmin();

// the verifications bucket is private: the admin reads it through short-lived signed URLs
const { data: url, status } = useLazyAsyncData(
  `admin-doc:${props.path}`,
  () => documentUrl(props.path),
  { server: false },
);

const isPdf = computed(() => props.path?.toLowerCase().endsWith('.pdf') ?? false);
</script>

<template>
  <figure class="text-sm">
    <figcaption class="mb-1 text-muted">
      {{ label }}
    </figcaption>

    <USkeleton
      v-if="status === 'pending' || status === 'idle'"
      class="aspect-4/3 w-full"
    />

    <p
      v-else-if="!url"
      class="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-default text-muted"
    >
      Ficheiro em falta
    </p>

    <UButton
      v-else-if="isPdf"
      :to="url"
      target="_blank"
      color="neutral"
      variant="subtle"
      icon="i-lucide-file-text"
      block
    >
      Abrir PDF
    </UButton>

    <a
      v-else
      :href="url"
      target="_blank"
      rel="noopener"
      class="block overflow-hidden rounded-lg border border-default"
    >
      <img
        :src="url"
        :alt="label"
        class="aspect-4/3 w-full object-cover"
        loading="lazy"
      >
    </a>
  </figure>
</template>
