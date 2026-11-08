<script setup lang="ts">
import type { Vehicle } from '~/composables/useVehicles'

const { vehicles, remove } = useVehicles()
const { toastError } = useBoleiaError()
const toast = useToast()

const formOpen = ref(false)
const editing = ref<Vehicle | null>(null)
const removing = ref<Vehicle | null>(null)
const pending = ref(false)

function add() {
  editing.value = null
  formOpen.value = true
}

function edit(v: Vehicle) {
  editing.value = v
  formOpen.value = true
}

async function confirmRemove() {
  if (!removing.value) return
  pending.value = true
  try {
    await remove(removing.value.id)
    toast.add({ title: 'Veículo removido', color: 'success', icon: 'i-lucide-check' })
    removing.value = null
  } catch (e) {
    await toastError(e)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="!vehicles.length"
      class="text-muted"
    >
      Ainda não adicionou nenhum veículo. Precisa de um para publicar viagens.
    </p>

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="v in vehicles"
        :key="v.id"
        class="flex items-center gap-4 py-3"
      >
        <div class="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated">
          <img
            v-if="v.photo_url"
            :src="v.photo_url"
            :alt="`${v.make} ${v.model}`"
            class="h-full w-full object-cover"
          >
          <UIcon
            v-else
            name="i-lucide-car"
            class="size-6 text-muted"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-medium">
            {{ v.make }} {{ v.model }}
            <UBadge
              v-if="v.verified"
              color="primary"
              variant="subtle"
              size="sm"
              icon="i-lucide-badge-check"
              class="ms-1 align-middle"
            >
              Verificado
            </UBadge>
          </p>
          <p class="text-sm text-muted">
            {{ [v.color, v.year, v.plate].filter(Boolean).join(' · ') }}
            <span v-if="v.color || v.year || v.plate"> · </span>{{ v.seats_total }} lugares
          </p>
        </div>
        <div class="flex shrink-0 flex-col gap-1 sm:flex-row">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-pencil"
            aria-label="Editar"
            @click="edit(v)"
          />
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-trash-2"
            aria-label="Remover"
            @click="removing = v"
          />
        </div>
      </li>
    </ul>

    <UButton
      variant="soft"
      icon="i-lucide-plus"
      @click="add"
    >
      Adicionar veículo
    </UButton>

    <ProfileVehicleForm
      v-model:open="formOpen"
      :vehicle="editing"
    />

    <UModal
      :open="!!removing"
      title="Remover veículo?"
      :description="removing ? `${removing.make} ${removing.model} deixa de aparecer nas suas viagens novas. As viagens já publicadas não mudam.` : ''"
      @update:open="(v: boolean) => { if (!v) removing = null }"
    >
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="removing = null"
        >
          Cancelar
        </UButton>
        <UButton
          color="error"
          :loading="pending"
          @click="confirmRemove"
        >
          Remover
        </UButton>
      </template>
    </UModal>
  </div>
</template>
