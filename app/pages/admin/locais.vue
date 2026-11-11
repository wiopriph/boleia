<script setup lang="ts">
import type { AdminPlace } from '~/composables/useAdmin';


useSeoMeta({ title: 'Locais', robots: 'noindex' });

const { fetchPlaces, mergePlaces } = useAdmin();
const toast = useToast();

const { data: places, error, refresh } = await useAsyncData('admin-places', fetchPlaces, { default: () => [] });

const search = ref('');
const filtered = computed(() => {
  const needle = slugify(search.value);

  return needle ?
    places.value.filter(place => slugify([place.name, place.province, place.slug, ...place.aliases].join(' ')).includes(needle)) :
    places.value;
});

const current = ref<AdminPlace | null>(null);
const isFormOpen = ref(false);
const isMergeOpen = ref(false);
const mergeTargetId = ref<string | undefined>();

function openForm(place: AdminPlace | null) {
  current.value = place;
  isFormOpen.value = true;
}

function openMerge(place: AdminPlace) {
  current.value = place;
  mergeTargetId.value = undefined;
  isMergeOpen.value = true;
}

const mergeItems = computed(() => places.value
  .filter(place => place.id !== current.value?.id && place.is_active)
  .map(place => ({ label: `${place.name}, ${place.province}`, value: place.id })));

async function runMerge() {
  await mergePlaces(current.value!.id, mergeTargetId.value!);
  toast.add({ title: 'Locais juntados', color: 'success', icon: 'i-lucide-check' });
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">
        Locais
      </h1>

      <UButton
        icon="i-lucide-plus"
        @click="openForm(null)"
      >
        Adicionar local
      </UButton>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Filtrar por nome, província ou identificador"
      class="mt-4 w-full"
      aria-label="Filtrar locais"
    />

    <UAlert
      v-if="error"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      title="Não foi possível carregar os locais"
    />

    <p
      v-else-if="!filtered.length"
      class="mt-6 text-center text-muted"
    >
      Nenhum local corresponde ao filtro.
    </p>

    <ul
      v-else
      class="mt-4 divide-y divide-default rounded-xl border border-default"
    >
      <li
        v-for="place in filtered"
        :key="place.id"
        class="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
      >
        <div class="min-w-0">
          <p class="font-medium">
            {{ place.name }}
            <span class="font-normal text-muted">· {{ place.province }} · {{ placeKindLabel(place.kind).toLowerCase() }} · {{ place.is_active ? 'ativo' : 'inativo' }}</span>
          </p>

          <p class="truncate text-muted">
            {{ place.slug }}<template v-if="place.aliases.length">
              · também: {{ place.aliases.join(', ') }}
            </template>
          </p>
        </div>

        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="openForm(place)"
          >
            Editar
          </UButton>

          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="openMerge(place)"
          >
            Juntar a outro
          </UButton>
        </div>
      </li>
    </ul>

    <AdminPlaceModal
      v-model:open="isFormOpen"
      :place="current"
      @saved="refresh"
    />

    <AdminActionModal
      v-model:open="isMergeOpen"
      :title="`Juntar ${current?.name ?? 'local'} a outro`"
      description="As viagens, as durações de rota e os outros nomes passam para o local escolhido. Este local fica inativo."
      confirmLabel="Juntar"
      isDestructive
      :hasReason="false"
      :isConfirmDisabled="!mergeTargetId"
      :action="runMerge"
      @done="refresh"
    >
      <UFormField label="Local que fica">
        <USelectMenu
          v-model="mergeTargetId"
          :items="mergeItems"
          valueKey="value"
          placeholder="Escolha o local"
          class="w-full"
        />
      </UFormField>
    </AdminActionModal>
  </div>
</template>
