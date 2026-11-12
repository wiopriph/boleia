<script setup lang="ts">
const props = defineProps<{ tripId: string, title: string }>();

const toast = useToast();
const { share, isSupported } = useShare();
const { copy } = useClipboard();

const shareUrl = computed(() => `${useSiteConfig().url}/t/${props.tripId}`);

async function onShare() {
  if (isSupported.value) {
    try {
      await share({ title: props.title, url: shareUrl.value });

      return;
    } catch {
      // user closed the share sheet; fall back to copying
    }
  }

  await copy(shareUrl.value);
  toast.add({ title: 'Ligação copiada', description: shareUrl.value, color: 'success', icon: 'i-lucide-check' });
}
</script>

<template>
  <UButton
    variant="ghost"
    color="neutral"
    icon="i-lucide-share-2"
    aria-label="Partilhar viagem"
    class="shrink-0 px-3"
    @click="onShare"
  >
    <span class="hidden sm:inline">Partilhar</span>
  </UButton>
</template>
