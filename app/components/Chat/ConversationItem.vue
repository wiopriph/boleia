<script setup lang="ts">
import type { Conversation } from '~/composables/useChat';


const props = defineProps<{ conversation: Conversation }>();

const userId = useUserId();

const unreadCount = computed(() => props.conversation.unread_count ?? 0);
const isMine = computed(() => !!props.conversation.last_message_sender_id && props.conversation.last_message_sender_id === userId.value);

const preview = computed(() => {
  const body = props.conversation.last_message_body;

  if (!body) {
    return 'Sem mensagens';
  }

  return isMine.value ? `Você: ${body}` : body;
});
</script>

<template>
  <NuxtLink
    :to="`/conta/mensagens/${conversation.id}`"
    class="flex items-center gap-3 py-3"
  >
    <UAvatar
      :src="conversation.other_user_avatar_url ?? undefined"
      :alt="conversation.other_user_name"
      icon="i-lucide-user-round"
      size="lg"
    />

    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <p
          class="truncate"
          :class="unreadCount ? 'font-semibold' : 'font-medium'"
        >
          {{ conversation.other_user_name }}
        </p>

        <span
          v-if="conversation.last_message_at"
          class="shrink-0 text-xs text-muted"
        >{{ formatDay(conversation.last_message_at) }}</span>
      </div>

      <p class="truncate text-xs text-muted">
        {{ conversation.origin_name }} para {{ conversation.destination_name }} · {{ formatDay(conversation.departure_at) }}
        <span v-if="conversation.closed_at"> · Fechada</span>
      </p>

      <p
        class="truncate text-sm"
        :class="unreadCount ? 'text-default' : 'text-muted'"
      >
        {{ preview }}
      </p>
    </div>

    <UBadge
      v-if="unreadCount"
      color="primary"
      class="shrink-0"
      :aria-label="`${unreadCount} mensagens por ler`"
    >
      {{ unreadCount }}
    </UBadge>
  </NuxtLink>
</template>
