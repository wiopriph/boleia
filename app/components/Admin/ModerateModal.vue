<script setup lang="ts">
import type { AdminActionPayload } from '~/components/Admin/ActionModal.vue';
import type { Enums, ModerationAction } from '~~/types/rpc';


const props = withDefaults(defineProps<{
  targetId: string
  targetName: string
  targetStatus: Enums<'profile_status'>
  reportId?: string
}>(), { reportId: undefined });
const emit = defineEmits<{ done: [] }>();
const isOpen = defineModel<boolean>('open', { default: false });

const { moderate } = useAdmin();

// an active account cannot be reactivated, a banned one only can
const choices = computed(() => MODERATION_CHOICES.filter((choice) => {
  if (props.targetStatus === 'active') {
    return choice.action !== 'unban';
  }

  return props.targetStatus === 'banned' ? choice.action === 'unban' : true;
}));

const action = ref<ModerationAction>('warn');
const selected = computed(() => choices.value.find(choice => choice.action === action.value) ?? choices.value[0]);

watch(isOpen, (isOpenNow) => {
  if (isOpenNow) {
    action.value = choices.value[0]?.action ?? 'warn';
  }
});

const items = computed(() => choices.value.map(choice => ({
  label: choice.label,
  description: choice.description,
  value: choice.action,
})));

async function run(payload: AdminActionPayload) {
  await moderate(props.targetId, action.value, payload.reason, payload.days ?? undefined, props.reportId);
}
</script>

<template>
  <AdminActionModal
    v-model:open="isOpen"
    :title="`Moderar ${targetName}`"
    :description="reportId ? 'A denúncia fica fechada com esta ação.' : undefined"
    :confirmLabel="selected?.label ?? 'Confirmar'"
    :isDestructive="selected?.isDestructive ?? false"
    :hasDays="action === 'suspend'"
    reasonHelp="O utilizador recebe o motivo na notificação."
    :action="run"
    @done="emit('done')"
  >
    <URadioGroup
      v-model="action"
      :items="items"
      legend="Ação"
    />
  </AdminActionModal>
</template>
