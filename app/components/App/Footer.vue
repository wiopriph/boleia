<script setup lang="ts">
const links = HELP_PAGES;
</script>

<template>
  <footer class="mt-auto border-t border-default bg-default py-10 text-sm">
    <UContainer>
      <div class="flex flex-col justify-between gap-8 sm:flex-row">
        <div>
          <AppLogo />

          <p class="mt-3 max-w-60 leading-relaxed text-muted">
            Partilha o caminho.<br>Viaja por Angola em companhia.
          </p>
        </div>

        <nav
          aria-label="Informações e ajuda"
          class="grid grid-cols-2 gap-x-6 gap-y-3 sm:gap-x-10"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="inline-flex min-h-8 items-center text-muted transition-colors hover:text-primary"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-5 text-xs text-muted">
        <p>
          © {{ new Date().getFullYear() }} Boleia
        </p>

        <p class="inline-flex items-center gap-1.5">
          <UIcon
            name="i-lucide-globe"
            class="size-3.5"
          /> Angola · Português
        </p>
      </div>
    </UContainer>
  </footer>
</template>
