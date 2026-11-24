<script setup lang="ts">
import type { NotificationRow } from '~/utils/notifications';

import { NuxtLink } from '#components';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Notificações', robots: 'noindex' });

const { fetchRecent, markRead, markAllRead } = useNotifications();

const { data: notifications, status } = await useAsyncData('notifications', fetchRecent, { default: () => [] });

const items = computed(() => notifications.value.map(notification => ({
  notification,
  view: notificationView(notification),
  isUnread: !notification.read_at,
})));

const hasUnread = computed(() => items.value.some(item => item.isUnread));
const isMarkingAll = ref(false);

function setReadLocally(ids: Set<string>) {
  const readAt = new Date().toISOString();

  notifications.value = notifications.value.map(notification => (
    ids.has(notification.id) && !notification.read_at ? { ...notification, read_at: readAt } : notification
  ));
}

// read one by one: a notification stays marked until it is opened or everything is marked at once
function read(notification: NotificationRow) {
  if (notification.read_at) {
    return;
  }

  setReadLocally(new Set([notification.id]));
  markRead([notification.id]).catch(() => undefined);
}

async function readAll() {
  isMarkingAll.value = true;

  try {
    await markAllRead();
    setReadLocally(new Set(notifications.value.map(notification => notification.id)));
  } finally {
    isMarkingAll.value = false;
  }
}
</script>

<template>
  <UiPage>
    <UiPageHeader
      title="Notificações"
      description="Acompanha as novidades das tuas viagens e reservas."
    >
      <UButton
        v-if="hasUnread"
        color="neutral"
        variant="outline"
        icon="i-lucide-check-check"
        :loading="isMarkingAll"
        @click="readAll"
      >
        Marcar todas como lidas
      </UButton>
    </UiPageHeader>

    <div
      v-if="status === 'pending' && !items.length"
      class="mt-4 space-y-2"
    >
      <USkeleton
        v-for="index in 4"
        :key="index"
        class="h-14 w-full"
      />
    </div>

    <ul
      v-else-if="items.length"
      class="mt-4 divide-y divide-default"
    >
      <li
        v-for="item in items"
        :key="item.notification.id"
      >
        <component
          :is="item.view.to ? NuxtLink : (item.isUnread ? 'button' : 'div')"
          :to="item.view.to ?? undefined"
          :type="!item.view.to && item.isUnread ? 'button' : undefined"
          class="-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-control px-3 py-3 text-left transition-colors"
          :class="item.view.to || item.isUnread ? 'cursor-pointer hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : ''"
          @click="read(item.notification)"
        >
          <UIcon
            :name="item.view.icon"
            class="mt-0.5 size-5 shrink-0"
            :class="item.isUnread ? 'text-primary' : 'text-muted'"
          />

          <div class="min-w-0 flex-1">
            <p class="break-words">
              <span :class="item.isUnread ? 'font-semibold text-highlighted' : 'font-medium'">{{ item.view.title }}</span>

              <template v-if="item.view.body">
                {{ ' ' }}<span :class="item.isUnread ? '' : 'text-muted'">{{ item.view.body }}</span>
              </template>
            </p>

            <p class="mt-0.5 text-xs text-muted">
              <template v-if="item.view.context">
                {{ item.view.context }} ·
              </template>

              <NuxtTime
                :datetime="item.notification.created_at"
                locale="pt-PT"
                relative
                relativeStyle="short"
                :title="formatDateTime(item.notification.created_at)"
              />

              <span
                v-if="item.isUnread"
                class="font-medium text-primary"
              > · nova</span>
            </p>
          </div>

          <UIcon
            v-if="item.view.to"
            name="i-lucide-chevron-right"
            class="mt-1 size-4 shrink-0 text-muted"
          />
        </component>
      </li>
    </ul>

    <UiEmptyState
      v-else
      icon="i-lucide-bell-off"
      title="Ainda não tem notificações."
      class="mt-6"
    />
  </UiPage>
</template>
