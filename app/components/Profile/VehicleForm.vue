<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Vehicle } from '~/composables/useVehicles'

const props = defineProps<{ vehicle?: Vehicle | null }>()
const open = defineModel<boolean>('open', { default: false })

const { save } = useVehicles()
const { messageFor } = useBoleiaError()
const toast = useToast()

const currentYear = new Date().getFullYear()
const schema = z.object({
  make: z.string().trim().min(2, 'Indique a marca'),
  model: z.string().trim().min(1, 'Indique o modelo'),
  color: z.string().trim().max(30).optional(),
  year: z.number().int().min(1980, 'Ano inválido').max(currentYear + 1, 'Ano inválido').optional(),
  plate: z.string().trim().max(12, 'Matrícula demasiado longa').optional(),
  seats_total: z.number().int().min(1, 'Mínimo 1').max(8, 'Máximo 8')
})
type Form = z.output<typeof schema>

const state = reactive<Form>({
  make: '',
  model: '',
  color: undefined,
  year: undefined,
  plate: undefined,
  seats_total: 4
})
const photoUrl = ref<string | null>(null)
const pending = ref(false)
const formError = ref<string | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  const v = props.vehicle
  state.make = v?.make ?? ''
  state.model = v?.model ?? ''
  state.color = v?.color ?? undefined
  state.year = v?.year ?? undefined
  state.plate = v?.plate ?? undefined
  state.seats_total = v?.seats_total ?? 4
  photoUrl.value = v?.photo_url ?? null
  formError.value = null
})

const plateChanged = computed(() => !!props.vehicle?.verified && !!props.vehicle.plate && state.plate !== props.vehicle.plate)

async function onSubmit(event: FormSubmitEvent<Form>) {
  formError.value = null
  pending.value = true
  try {
    await save({
      ...(props.vehicle ? { id: props.vehicle.id } : {}),
      make: event.data.make,
      model: event.data.model,
      color: event.data.color || undefined,
      year: event.data.year,
      plate: event.data.plate?.toUpperCase() || undefined,
      seats_total: event.data.seats_total,
      photo_url: photoUrl.value ?? undefined
    })
    toast.add({ title: props.vehicle ? 'Veículo atualizado' : 'Veículo adicionado', color: 'success', icon: 'i-lucide-check' })
    open.value = false
  } catch (e) {
    formError.value = messageFor(e)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
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
              :min="1980"
              :max="currentYear + 1"
              :format-options="{ useGrouping: false }"
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
          v-if="plateChanged"
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
            @click="open = false"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            :loading="pending"
          >
            Guardar
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
