<script setup lang="ts">
const { rpc } = useRpc()
const db = useDb()
const { messageFor } = useBoleiaError()

const open = ref(false)
const pending = ref(false)
const error = ref<string | null>(null)

async function confirm() {
  pending.value = true
  error.value = null
  try {
    await rpc('delete_me', {} as never)
    // the server already revoked the sessions; this only drops the local cookies
    await db.auth.signOut({ scope: 'local' })
    await navigateTo('/', { replace: true })
  } catch (e) {
    error.value = messageFor(e)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm text-muted">
      Os seus dados pessoais são apagados. O histórico de viagens fica anónimo por razões contabilísticas.
      Não é possível apagar a conta com reservas ativas ou saldo na carteira.
    </p>
    <UButton
      color="error"
      variant="soft"
      icon="i-lucide-trash-2"
      @click="open = true"
    >
      Apagar conta
    </UButton>

    <UModal
      v-model:open="open"
      title="Apagar a conta?"
      description="Esta ação não pode ser anulada. Deixa de conseguir entrar com este número."
    >
      <template #body>
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="error"
        />
      </template>
      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="open = false"
        >
          Cancelar
        </UButton>
        <UButton
          color="error"
          :loading="pending"
          @click="confirm"
        >
          Apagar definitivamente
        </UButton>
      </template>
    </UModal>
  </div>
</template>
