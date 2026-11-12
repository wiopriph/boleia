<script setup lang="ts">
import type { Message } from '~/composables/useChat';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Conversa', robots: 'noindex' });

const route = useRoute();
const conversationId = String(route.params.id ?? '');
const userId = useUserId();
const { fetchConversation, fetchMessages, markRead, pageSize } = useChat();

const { data: conversation } = await useAsyncData(`conversation:${conversationId}`, () => fetchConversation(conversationId));
const { data: latestPage } = await useAsyncData(
  `messages:${conversationId}`,
  () => fetchMessages(conversationId),
  { default: () => [] as Message[] },
);

// the newest page is the SSR payload; older pages and live inserts are client-side additions
const olderMessages = ref<Message[]>([]);
const liveMessages = ref<Message[]>([]);
const hasOlder = ref(latestPage.value.length === pageSize);
const isLoadingOlder = ref(false);

const messages = computed(() => {
  const seen = new Set<number>();

  return [...olderMessages.value, ...latestPage.value, ...liveMessages.value].filter((message) => {
    if (seen.has(message.id)) {
      return false;
    }

    seen.add(message.id);

    return true;
  });
});

const isPassenger = computed(() => conversation.value?.passenger_id === userId.value);
const isClosed = computed(() => !!conversation.value?.closed_at);
const contextLink = computed(() => {
  const current = conversation.value;

  if (!current) {
    return null;
  }

  if (!isPassenger.value) {
    return { to: `/conta/viagens/${current.trip_id}`, label: 'Ver a viagem' };
  }

  return current.booking_id ?
    { to: `/conta/reservas/${current.booking_id}`, label: 'Ver a reserva' } :
    { to: `/viagem/${current.trip_id}`, label: 'Reservar lugar' };
});

const listEnd = ref<HTMLElement | null>(null);

function scrollToEnd() {
  nextTick(() => listEnd.value?.scrollIntoView({ block: 'end' }));
}

async function markSeen() {
  const lastFromOther = [...messages.value].reverse().find(message => message.sender_id !== userId.value);

  if (lastFromOther && !lastFromOther.read_at) {
    await markRead(conversationId, lastFromOther.id).catch(() => undefined);
  }
}

async function loadOlder() {
  const first = messages.value[0];

  if (!first || isLoadingOlder.value) {
    return;
  }

  isLoadingOlder.value = true;

  try {
    const page = await fetchMessages(conversationId, first.id);

    olderMessages.value = [...page, ...olderMessages.value];
    hasOlder.value = page.length === pageSize;
  } finally {
    isLoadingOlder.value = false;
  }
}

useRealtimeChat(conversationId, (message) => {
  liveMessages.value = [...liveMessages.value, message];
  scrollToEnd();

  if (message.sender_id !== userId.value) {
    markRead(conversationId, message.id).catch(() => undefined);
  }
});

onMounted(() => {
  scrollToEnd();
  markSeen();
});
</script>

<template>
  <div class="my-6 flex h-[calc(100dvh-12.5rem)] min-h-96 flex-col overflow-hidden rounded-card border border-default bg-default lg:my-10 lg:h-[calc(100dvh-9.5rem)]">
    <template v-if="!conversation">
      <div class="p-5 sm:p-6">
        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-message-circle-off"
          title="Conversa não encontrada"
          description="A ligação pode estar errada ou a conversa pertence a outra conta."
        />

        <UButton
          class="mt-4"
          to="/conta/mensagens"
          variant="soft"
        >
          Mensagens
        </UButton>
      </div>
    </template>

    <template v-else>
      <header class="flex flex-wrap items-center gap-3 border-b border-default px-4 py-3">
        <UButton
          to="/conta/mensagens"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          aria-label="Voltar às mensagens"
          class="-ms-2"
        />

        <UAvatar
          :src="conversation.other_user_avatar_url ?? undefined"
          :alt="conversation.other_user_name"
          icon="i-lucide-user-round"
        />

        <div class="min-w-24 flex-1">
          <p class="truncate font-medium">
            {{ conversation.other_user_name }}
          </p>

          <p class="truncate text-xs text-muted">
            {{ conversation.origin_name }} para {{ conversation.destination_name }} · {{ formatDateTime(conversation.departure_at) }}
          </p>
        </div>

        <UButton
          v-if="contextLink"
          :to="contextLink.to"
          size="sm"
          :variant="conversation.booking_id || !isPassenger ? 'soft' : 'solid'"
          :color="conversation.booking_id || !isPassenger ? 'neutral' : 'primary'"
        >
          {{ contextLink.label }}
        </UButton>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-3">
        <p class="mx-auto mb-3 flex max-w-sm items-start gap-2 rounded-lg bg-elevated px-3 py-2 text-xs text-muted">
          <UIcon
            name="i-lucide-eye-off"
            class="mt-0.5 size-3.5 shrink-0"
          />
          Números de telefone e ligações ficam ocultos até 2 horas antes da viagem. O pagamento é sempre feito pela Boleia.
        </p>

        <div
          v-if="hasOlder"
          class="mb-3 flex justify-center"
        >
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            :loading="isLoadingOlder"
            @click="loadOlder"
          >
            Carregar anteriores
          </UButton>
        </div>

        <ul class="space-y-2">
          <ChatMessageBubble
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :isMine="message.sender_id === userId"
          />
        </ul>

        <p
          v-if="!messages.length"
          class="mt-8 text-center text-sm text-muted"
        >
          Ainda não há mensagens nesta conversa.
        </p>

        <div ref="listEnd" />
      </div>

      <p
        v-if="isClosed"
        class="border-t border-default px-4 py-3 text-center text-sm text-muted"
      >
        Esta conversa está fechada.
      </p>

      <ChatComposer
        v-else
        :conversationId="conversation.id"
        @sent="scrollToEnd"
      />
    </template>
  </div>
</template>
