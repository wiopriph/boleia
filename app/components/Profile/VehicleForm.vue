<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Vehicle } from '~/composables/useVehicles';


const props = defineProps<{ vehicle?: Vehicle | null }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { save } = useVehicles();
const { messageFor } = useBoleiaError();
const toast = useToast();

// same range as upsert_vehicle (YEAR_INVALID)
const MIN_VEHICLE_YEAR = 1980;
const MAX_VEHICLE_YEAR = 2030;
const schema = z.object({
  make: z.string().trim()
    .min(2, 'Indique a marca'),
  model: z.string().trim()
    .min(1, 'Indique o modelo'),
  color: z.string().trim()
    .max(30)
    .optional(),
  year: z.number().int()
    .min(MIN_VEHICLE_YEAR, 'Ano inválido')
    .max(MAX_VEHICLE_YEAR, 'Ano inválido')
    .optional(),
  plate: z.string().trim()
    .max(12, 'Matrícula demasiado longa')
    .optional(),
  seats_total: z.number().int()
    .min(1, 'Mínimo 1')
    .max(8, 'Máximo 8'),
});

type Form = z.output<typeof schema>;

const state = reactive<Form>({
  make: '',
  model: '',
  color: undefined,
  year: undefined,
  plate: undefined,
  seats_total: 4,
});
const photoUrl = ref<string | null>(null);
const isPending = ref(false);
const formError = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (!isOpen.value) {
    return;
  }

  const vehicle = props.vehicle;

  state.make = vehicle?.make ?? '';
  state.model = vehicle?.model ?? '';
  state.color = vehicle?.color ?? undefined;
  state.year = vehicle?.year ?? undefined;
  state.plate = vehicle?.plate ?? undefined;
  state.seats_total = vehicle?.seats_total ?? 4;
  photoUrl.value = vehicle?.photo_url ?? null;
  formError.value = null;
});

const hasPlateChanged = computed(() => !!props.vehicle?.verified && !!props.vehicle.plate && state.plate !== props.vehicle.plate);

async function onSubmit(event: FormSubmitEvent<Form>) {
  formError.value = null;
  isPending.value = true;

  try {
    await save({
      ...(props.vehicle ? { id: props.vehicle.id } : {}),
      make: event.data.make,
      model: event.data.model,
      color: event.data.color || undefined,
      year: event.data.year,
      plate: event.data.plate?.toUpperCase() || undefined,
      seats_total: event.data.seats_total,
      photo_url: photoUrl.value ?? undefined,
    });

    toast.add({
      title: props.vehicle ? 'Veículo atualizado' : 'Veículo adicionado',
      color: 'success',
      icon: 'i-lucide-check',
    });

    isOpen.value = false;
  } catch (error) {
    formError.value = messageFor(error);
  } finally {
    isPending.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="vehicle ? 'Editar veículo' : 'Adicionar veículo'"
    description="Os passageiros vêem a marca, o modelo, a cor e a fotografia. A matrícula fica privada."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Fotografia">
          <UiPhotoUpload
            v-model="photoUrl"
            bucket="vehicles"
            :alt="`${state.make} ${state.model}`"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField
            label="Marca"
            name="make"
          >
            <UInput
              v-model="state.make"
              placeholder="Toyota"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Modelo"
            name="model"
          >
            <UInput
              v-model="state.model"
              placeholder="Hiace"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Cor"
            name="color"
          >
            <UInput
              v-model="state.color"
              placeholder="branco"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Ano"
            name="year"
          >
            <UInputNumber
              v-model="state.year"
              :min="MIN_VEHICLE_YEAR"
              :max="MAX_VEHICLE_YEAR"
              :formatOptions="{ useGrouping: false }"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Matrícula"
            name="plate"
          >
            <UInput
              v-model="state.plate"
              placeholder="LD-12-34-AB"
              class="w-full font-mono uppercase"
            />
          </UFormField>

          <UFormField
            label="Lugares (sem o condutor)"
            name="seats_total"
          >
            <UInputNumber
              v-model="state.seats_total"
              :min="1"
              :max="8"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="hasPlateChanged"
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          description="Mudar a matrícula retira a verificação deste veículo. Terá de enviar os documentos de novo."
        />

        <UAlert
          v-if="formError"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="formError"
        />

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="isOpen = false"
          >
            Cancelar
          </UButton>

          <UButton
            type="submit"
            :loading="isPending"
          >
            Guardar
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
