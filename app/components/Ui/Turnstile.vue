<script setup lang="ts">
// Cloudflare Turnstile in front of "send the code": every SMS costs money and the form is public.
// Without NUXT_PUBLIC_TURNSTILE_SITE_KEY nothing is rendered and no token is asked for.
interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

const READY_CALLBACK = '__boleiaTurnstileReady';

const token = defineModel<string>({ default: '' });

const siteKey = useRuntimeConfig().public.turnstileSiteKey;
const container = ref<HTMLElement | null>(null);

let widgetId: string | null = null;

function api(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function render() {
  const turnstile = api();

  if (!turnstile || !container.value || widgetId) {
    return;
  }

  widgetId = turnstile.render(container.value, {
    'sitekey': siteKey,
    'theme': 'light',
    'language': 'pt',
    'size': 'flexible',
    'callback': (value: string) => {
      token.value = value;
    },
    'expired-callback': () => {
      token.value = '';
    },
    'error-callback': () => {
      token.value = '';
    },
  });
}

// a token is single-use: ask for a fresh one after every request that spent it
function reset() {
  token.value = '';

  if (widgetId) {
    api()?.reset(widgetId);
  }
}

defineExpose({ reset });

if (siteKey) {
  useHead({
    script: [{
      src: `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${READY_CALLBACK}&render=explicit`,
      async: true,
      defer: true,
    }],
  });

  onMounted(() => {
    (window as unknown as Record<string, unknown>)[READY_CALLBACK] = render;
    render();
  });

  onBeforeUnmount(() => {
    if (widgetId) {
      api()?.remove(widgetId);
      widgetId = null;
    }
  });
}
</script>

<template>
  <div
    v-if="siteKey"
    ref="container"
    class="min-h-16"
  />
</template>
