<script setup lang="ts">
import type { Enums } from '~~/types/rpc';


const props = defineProps<{ targetId: string, targetName: string }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { reportUser } = usePublicProfile();
const { messageFor } = useBoleiaError();
const toast = useToast();

const DETAILS_MAX = 1000;
const reason = ref<Enums<'report_reason'> | undefined>(undefined);
const details = ref('');
const isSending = ref(false);
const errorText = ref<string | null>(null);

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    reason.value = undefined;
    details.value = '';
    errorText.value = null;
  }
});

async function send() {
  if (!reason.value) {
    errorText.value = 'Escolha o motivo.';

    return;
  }

  isSending.value = true;
  errorText.value = null;

  try {
    await reportUser(props.targetId, reason.value, details.value.trim() || undefined);
    toast.add({ title: 'Denúncia enviada', description: 'A moderação da Boleia vai analisar.', color: 'success', icon: 'i-lucide-check' });
    isOpen.value = false;
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`Denunciar ${targetName}`"
    description="A denúncia é confidencial. Só a moderação da Boleia a vê."
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Motivo">
          <URadioGroup
            v-model="reason"
            :items="REPORT_REASONS"
          />
        </UFormField>

        <UFormField
          label="O que aconteceu"
          :help="`Opcional. ${details.length}/${DETAILS_MAX}`"
        >
          <UTextarea
            v-model="details"
            :rows="3"
            :maxlength="DETAILS_MAX"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorText"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="errorText"
        />
      </div>
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
        :loading="isSending"
        @click="send"
      >
        Enviar denúncia
      </UButton>
    </template>
  </UModal>
</template>
