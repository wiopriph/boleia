<script setup lang="ts">
const props = defineProps<{ bookingId: string, passengerId: string | null, driverId: string | null }>();

const { fetchBookingChat } = useAdmin();

const { data: messages, status } = useLazyAsyncData(
  `admin-chat:${props.bookingId}`,
  () => fetchBookingChat(props.bookingId),
  { server: false },
);

function senderLabel(senderId: string | null) {
  if (!senderId) {
    return 'Sistema';
  }

  if (senderId === props.passengerId) {
    return 'Passageiro';
  }

  return senderId === props.driverId ? 'Condutor' : 'Outro';
}
</script>

<template>
  <div>
    <USkeleton
      v-if="status === 'pending' || status === 'idle'"
      class="h-16 w-full"
    />

    <p
      v-else-if="!messages"
      class="text-sm text-muted"
    >
      Sem conversa associada a esta reserva.
    </p>

    <p
      v-else-if="!messages.length"
      class="text-sm text-muted"
    >
      A conversa não tem mensagens.
    </p>

    <ol
      v-else
      class="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-elevated/50 p-3"
    >
      <li
        v-for="message in messages"
        :key="message.id"
        class="text-sm"
      >
        <p class="text-xs text-muted">
          {{ senderLabel(message.sender_id) }} · {{ formatDateTime(message.created_at) }}
        </p>

        <p class="whitespace-pre-wrap break-words">
          {{ message.body }}
        </p>
      </li>
    </ol>
  </div>
</template>
