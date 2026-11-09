<script setup lang="ts">
import type { TripPublic } from '~/composables/useTrip';


const props = defineProps<{ trip: TripPublic }>();

const user = useSupabaseUser();
const route = useRoute();
const { askDriver } = useChat();
const { messageFor } = useBoleiaError();
const toast = useToast();

const isOpen = ref(false);
const body = ref('');
const isSending = ref(false);
const errorText = ref<string | null>(null);

const MAX_LENGTH = 1000;

function open() {
  if (!user.value) {
    navigateTo({ path: '/entrar', query: { redirect: route.fullPath } });

    return;
  }

  isOpen.value = true;
}

async function send() {
  const text = body.value.trim();

  if (!text) {
    errorText.value = 'Escreva uma mensagem.';

    return;
  }

  errorText.value = null;
  isSending.value = true;

  try {
    const conversationId = await askDriver(props.trip.id, text);

    isOpen.value = false;
    body.value = '';
    toast.add({ title: 'Mensagem enviada', description: 'O condutor responde na conversa.', color: 'success', icon: 'i-lucide-check' });

    if (conversationId) {
      await navigateTo(`/conta/mensagens/${conversationId}`);
    }
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <div>
    <UButton
      variant="soft"
      color="neutral"
      size="xl"
      block
      icon="i-lucide-message-circle"
      @click="open"
    >
      Perguntar ao condutor
    </UButton>

    <UModal
      v-model:open="isOpen"
      :title="`Mensagem para ${trip.driver_name}`"
      description="Números de telefone e ligações ficam ocultos até 2 horas antes da viagem."
    >
      <template #body>
        <UFormField
          :error="errorText ?? undefined"
          :help="`${body.length}/${MAX_LENGTH}`"
        >
          <UTextarea
            v-model="body"
            :rows="4"
            :maxlength="MAX_LENGTH"
            autofocus
            placeholder="Ainda tem lugar? Passa perto de ...?"
            class="w-full"
          />
        </UFormField>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isOpen = false"
        >
          Cancelar
        </UButton>

        <UButton
          icon="i-lucide-send"
          :loading="isSending"
          @click="send"
        >
          Enviar
        </UButton>
      </template>
    </UModal>
  </div>
</template>
