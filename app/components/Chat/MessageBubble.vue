<script setup lang="ts">
import type { Message } from '~/composables/useChat';


const props = defineProps<{ message: Message, isMine: boolean }>();

const isSystem = computed(() => props.message.sender_id === null);
</script>

<template>
  <li
    v-if="isSystem"
    class="flex justify-center"
  >
    <p class="max-w-[85%] rounded-full bg-elevated px-3 py-1 text-center text-xs text-muted">
      {{ message.body }}
    </p>
  </li>

  <li
    v-else
    class="flex"
    :class="isMine ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[80%] rounded-2xl px-3 py-2"
      :class="isMine ? 'rounded-br-sm bg-primary text-inverted' : 'rounded-bl-sm bg-elevated'"
    >
      <p class="whitespace-pre-wrap break-words text-sm">
        {{ message.body }}
      </p>

      <p
        class="mt-0.5 text-right text-[11px]"
        :class="isMine ? 'text-inverted/70' : 'text-muted'"
      >
        <span v-if="message.masked">número ou ligação ocultos · </span>{{ formatTime(message.created_at) }}
      </p>
    </div>
  </li>
</template>
