<script setup lang="ts">
export interface SectionLink {
  label: string
  icon: string
  to: string
  count?: number | null
  isExact?: boolean
  // other paths that belong to this link (a flow started from the section)
  also?: string[]
}

// Frame of an area with its own navigation (account, administration): links in a left column on
// desktop and in a dropdown on phones, the page in the remaining width of the shared container.
const props = defineProps<{ title: string, links: SectionLink[] }>();

const route = useRoute();

provide(PAGE_SHELL_KEY, true);

function isActive(link: SectionLink) {
  if (link.isExact) {
    return route.path === link.to;
  }

  return [link.to, ...(link.also ?? [])].some(prefix => route.path.startsWith(prefix));
}

function labelOf(link: SectionLink) {
  return link.count ? `${link.label} (${link.count})` : link.label;
}

const current = computed(() => props.links.find(isActive) ?? props.links[0]!);
const menuItems = computed(() => props.links.map(link => ({ label: labelOf(link), icon: link.icon, to: link.to })));
</script>

<template>
  <UContainer class="grid gap-x-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
    <div>
      <div class="border-b border-default py-4 lg:hidden">
        <UDropdownMenu
          :items="menuItems"
          :content="{ align: 'start' }"
          :ui="{ content: 'w-64' }"
        >
          <UButton
            :icon="current.icon"
            variant="outline"
            color="neutral"
            trailingIcon="i-lucide-chevrons-up-down"
            block
          >
            {{ labelOf(current) }}
          </UButton>
        </UDropdownMenu>
      </div>

      <aside class="sticky top-26 hidden pt-10 pb-8 lg:block">
        <p class="eyebrow mb-5 px-4">
          {{ title }}
        </p>

        <nav
          :aria-label="title"
          class="space-y-1"
        >
          <UButton
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :icon="link.icon"
            :variant="isActive(link) ? 'soft' : 'ghost'"
            :color="isActive(link) ? 'primary' : 'neutral'"
            :aria-current="isActive(link) ? 'page' : undefined"
            class="w-full justify-start"
            size="lg"
          >
            <span class="min-w-0 flex-1 truncate text-left">{{ link.label }}</span>

            <UBadge
              v-if="link.count"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ link.count }}
            </UBadge>
          </UButton>
        </nav>

        <div
          v-if="$slots.note"
          class="mt-8 border-t border-default px-4 pt-5"
        >
          <slot name="note" />
        </div>
      </aside>
    </div>

    <div class="min-w-0">
      <slot />
    </div>
  </UContainer>
</template>
