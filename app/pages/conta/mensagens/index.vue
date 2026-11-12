<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Mensagens', robots: 'noindex' });

const { fetchConversations } = useChat();

// pull on open: the list has no realtime subscription (spec section 7)
const { data: conversations, status, error } = await useAsyncData('conversations', fetchConversations, { default: () => [] });
</script>

<template>
  <UiPage>
    <UiPageHeader
      title="Mensagens"
      description="Combina os detalhes da viagem com o condutor ou os passageiros."
    />

    <div
      v-if="status === 'pending' && !conversations.length"
      class="mt-4 space-y-3"
    >
      <USkeleton
        v-for="index in 4"
        :key="index"
        class="h-16 w-full"
      />
    </div>

    <UAlert
      v-else-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar as conversas"
      description="Verifique a ligação e tente novamente."
    />

    <ul
      v-else-if="conversations.length"
      class="mt-2 divide-y divide-default"
    >
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
      >
        <ChatConversationItem :conversation="conversation" />
      </li>
    </ul>

    <UiEmptyState
      v-else
      icon="i-lucide-message-circle"
      title="Ainda não tem conversas"
      description="Pode perguntar a um condutor na página da viagem."
      class="mt-6"
    >
      <UButton
        to="/"
        icon="i-lucide-search"
      >
        Procurar boleia
      </UButton>
    </UiEmptyState>
  </UiPage>
</template>
