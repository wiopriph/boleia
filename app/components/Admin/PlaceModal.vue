<script setup lang="ts">
import type { AdminPlace } from '~/composables/useAdmin';
import type { Enums } from '~~/types/rpc';


const props = defineProps<{ place: AdminPlace | null }>();
const emit = defineEmits<{ saved: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { upsertPlace } = useAdmin();
const { messageFor } = useBoleiaError();
const toast = useToast();

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const state = reactive({
  name: '',
  province: '',
  slug: '',
  kind: 'city' as Enums<'place_kind'>,
  lat: '',
  lng: '',
  aliases: [] as string[],
  isActive: true,
});
const isSaving = ref(false);
const errorText = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (!isOpenNow) {
    return;
  }

  state.name = props.place?.name ?? '';
  state.province = props.place?.province ?? '';
  state.slug = props.place?.slug ?? '';
  state.kind = props.place?.kind ?? 'city';
  state.lat = props.place?.lat?.toString() ?? '';
  state.lng = props.place?.lng?.toString() ?? '';
  state.aliases = [...(props.place?.aliases ?? [])];
  state.isActive = props.place?.is_active ?? true;
  errorText.value = null;
});

// a new place gets its identifier from the name until the admin edits it
function onNameBlur() {
  if (!props.place && !state.slug) {
    state.slug = slugify(state.name);
  }
}

function parseCoordinate(value: string): number | null | undefined {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : undefined;
}

async function save() {
  const lat = parseCoordinate(state.lat);
  const lng = parseCoordinate(state.lng);

  if (!state.name.trim() || !state.province.trim()) {
    errorText.value = 'Indique o nome e a província.';

    return;
  }

  if (!SLUG_PATTERN.test(state.slug)) {
    errorText.value = 'O identificador só pode ter letras minúsculas, algarismos e hífenes.';

    return;
  }

  if (lat === undefined || lng === undefined) {
    errorText.value = 'As coordenadas têm de ser números.';

    return;
  }

  isSaving.value = true;
  errorText.value = null;

  try {
    await upsertPlace({
      id: props.place?.id,
      name: state.name.trim(),
      province: state.province.trim(),
      slug: state.slug,
      kind: state.kind,
      lat,
      lng,
      aliases: state.aliases.map(alias => alias.trim()).filter(Boolean),
      is_active: state.isActive,
    });

    toast.add({ title: props.place ? 'Local atualizado' : 'Local adicionado', color: 'success', icon: 'i-lucide-check' });
    isOpen.value = false;
    emit('saved');
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="place ? `Editar ${place.name}` : 'Adicionar local'"
    :description="place ? 'Mudar o identificador muda os endereços das páginas deste local.' : undefined"
  >
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="save"
      >
        <UFormField
          label="Nome"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
            @blur="onNameBlur"
          />
        </UFormField>

        <UFormField
          label="Província"
          required
        >
          <UInput
            v-model="state.province"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Identificador"
          help="Usado nos endereços: /boleias/identificador."
          required
        >
          <UInput
            v-model="state.slug"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tipo">
          <USelect
            v-model="state.kind"
            :items="PLACE_KIND_ITEMS"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Latitude">
            <UInput
              v-model="state.lat"
              inputmode="decimal"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Longitude">
            <UInput
              v-model="state.lng"
              inputmode="decimal"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Outros nomes"
          help="Nomes pelos quais o local também é pesquisado. Enter para juntar cada um."
        >
          <UInputTags
            v-model="state.aliases"
            class="w-full"
          />
        </UFormField>

        <USwitch
          v-model="state.isActive"
          label="Ativo"
          description="Os locais inativos não aparecem na pesquisa nem na publicação."
        />

        <UAlert
          v-if="errorText"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="errorText"
        />
      </form>
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        color="neutral"
        @click="isOpen = false"
      >
        Voltar
      </UButton>

      <UButton
        :loading="isSaving"
        @click="save"
      >
        Guardar
      </UButton>
    </template>
  </UModal>
</template>
