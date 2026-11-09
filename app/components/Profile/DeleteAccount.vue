<script setup lang="ts">
const { rpc } = useRpc();
const db = useDb();
const { messageFor } = useBoleiaError();

const isOpen = ref(false);
const isPending = ref(false);
const errorText = ref<string | null>(null);

async function confirm() {
  isPending.value = true;
  errorText.value = null;

  try {
    await rpc('delete_me', {} as never);
    // the server already revoked the sessions; this only drops the local cookies
    await db.auth.signOut({ scope: 'local' });
    await navigateTo('/', { replace: true });
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isPending.value = false;
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
      @click="isOpen = true"
    >
      Apagar conta
    </UButton>

    <UModal
      v-model:open="isOpen"
      title="Apagar a conta?"
      description="Esta ação não pode ser anulada. Deixa de conseguir entrar com este número."
    >
      <template #body>
        <UAlert
          v-if="errorText"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="errorText"
        />
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isOpen = false"
        >
          Cancelar
        </UButton>

        <UButton
          color="error"
          :loading="isPending"
          @click="confirm"
        >
          Apagar definitivamente
        </UButton>
      </template>
    </UModal>
  </div>
</template>
