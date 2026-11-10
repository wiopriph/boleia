<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Notificações', robots: 'noindex' });

const { fetchRecent, markRead } = useNotifications();

const { data: notifications, status } = await useAsyncData('notifications', fetchRecent, { default: () => [] });

const items = computed(() => notifications.value.map(notification => ({
  notification,
  view: notificationView(notification),
  isUnread: !notification.read_at,
})));

// opening the page is reading it: the unread markers stay visible for this visit only
onMounted(() => {
  markRead(notifications.value.filter(notification => !notification.read_at).map(notification => notification.id));
});
</script>

<template>
  <UContainer class="max-w-2xl py-8">
    <h1 class="text-2xl font-semibold">
      Notificações
    </h1>

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
          :is="item.view.to ? resolveComponent('NuxtLink') : 'div'"
          :to="item.view.to ?? undefined"
          class="flex items-start gap-3 py-3"
        >
          <UIcon
            :name="item.view.icon"
            class="mt-0.5 size-5 shrink-0"
            :class="item.isUnread ? 'text-primary' : 'text-muted'"
          />

          <div class="min-w-0 flex-1">
            <p :class="item.isUnread ? 'font-medium' : ''">
              {{ item.view.title }}
            </p>

            <p class="text-xs text-muted">
              {{ formatDateTime(item.notification.created_at) }}
              <span v-if="item.isUnread"> · nova</span>
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

    <div
      v-else
      class="mt-10 flex flex-col items-center gap-3 text-center text-muted"
    >
      <UIcon
        name="i-lucide-bell-off"
        class="size-10"
      />

      <p>
        Ainda não tem notificações.
      </p>
    </div>
  </UContainer>
</template>
