<script setup lang="ts">
const props = defineProps<{ conversationId: string }>();
const emit = defineEmits<{ sent: [] }>();

const { sendMessage } = useChat();
const { messageFor } = useBoleiaError();

const body = ref('');
const isSending = ref(false);
const errorText = ref<string | null>(null);

async function send() {
  const text = body.value.trim();

  if (!text || isSending.value) {
    return;
  }

  errorText.value = null;
  isSending.value = true;

  try {
    // the message itself arrives through the realtime channel, so nothing is drawn optimistically
    await sendMessage(props.conversationId, text);
    body.value = '';
    emit('sent');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSending.value = false;
  }
}

function onEnter(event: KeyboardEvent) {
  // Enter sends on a keyboard; Shift+Enter and touch keyboards keep the line break
  if (event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  send();
}
</script>

<template>
  <form
    class="border-t border-default bg-default px-4 py-3"
    @submit.prevent="send"
  >
    <p
      v-if="errorText"
      class="mb-2 text-sm text-error"
    >
      {{ errorText }}
    </p>

    <div class="flex items-end gap-2">
      <UTextarea
        v-model="body"
        :rows="1"
        :maxrows="5"
        autoresize
        :maxlength="MESSAGE_MAX_LENGTH"
        placeholder="Escreva uma mensagem"
        class="min-w-0 flex-1"
        size="lg"
        @keydown.enter="onEnter"
      />

      <UButton
        type="submit"
        size="lg"
        icon="i-lucide-send"
        aria-label="Enviar"
        :loading="isSending"
        :disabled="!body.trim()"
      />
    </div>
  </form>
</template>
