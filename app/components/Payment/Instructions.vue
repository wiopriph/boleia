<script setup lang="ts">
import QRCode from 'qrcode';
import type { PaymentInstructions } from '~~/types/rpc';


const props = defineProps<{ instructions: PaymentInstructions | null, phone: string | null }>();

const qrDataUrl = ref<string | null>(null);

watch(() => props.instructions, async (instructions) => {
  const payload = instructions && 'qr_payload' in instructions ? instructions.qr_payload : null;

  qrDataUrl.value = payload ? await QRCode.toDataURL(payload, { width: 240, margin: 1 }) : null;
}, { immediate: true });
</script>

<template>
  <div
    v-if="qrDataUrl"
    class="flex flex-col items-center gap-3 text-center"
  >
    <img
      :src="qrDataUrl"
      alt="Código QR para pagar na Multicaixa Express"
      class="size-60 rounded-lg bg-white p-2"
    >

    <p class="font-medium">
      Leia o código na app Multicaixa Express
    </p>

    <p class="text-sm text-muted">
      Abra a app no telemóvel, escolha "Pagamentos" e aponte a câmara para o código.
    </p>
  </div>

  <div
    v-else-if="instructions?.type === 'redirect'"
    class="flex flex-col items-center gap-3 text-center"
  >
    <UIcon
      name="i-lucide-external-link"
      class="size-10 text-primary"
    />

    <p class="font-medium">
      Conclua o pagamento na página do banco
    </p>

    <UButton
      :to="instructions.url"
      target="_blank"
      size="lg"
      icon="i-lucide-arrow-up-right"
    >
      Abrir pagamento
    </UButton>

    <p class="text-sm text-muted">
      Depois de pagar, volte a esta página.
    </p>
  </div>

  <div
    v-else
    class="flex flex-col items-center gap-3 text-center"
  >
    <UIcon
      name="i-lucide-smartphone-nfc"
      class="size-10 text-primary"
    />

    <p class="font-medium">
      Confirme o pagamento na app Multicaixa Express
    </p>

    <p class="text-sm text-muted">
      Enviámos um pedido de pagamento para o telemóvel
      <span class="font-medium text-default">{{ phone ? formatPhone(phone) : 'da sua conta' }}</span>.
      Abra a notificação ou a app e aprove o pagamento.
    </p>
  </div>
</template>
