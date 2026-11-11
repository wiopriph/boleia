<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Avaliar', robots: 'noindex' });

const route = useRoute();
const bookingId = String(route.params.id ?? '');
const userId = useUserId();
const { fetchBooking } = useBooking();
const { submitReview, fetchOwnReview } = useReviews();
const { messageFor } = useBoleiaError();
const toast = useToast();

const { data, refresh } = await useAsyncData(`review:${bookingId}`, async () => {
  const booking = await fetchBooking(bookingId);
  const ownReview = booking ? await fetchOwnReview(bookingId) : null;

  return { booking, ownReview };
});

const booking = computed(() => data.value?.booking ?? null);
const ownReview = computed(() => data.value?.ownReview ?? null);

// the side is decided by the booking: the passenger rates the driver and the other way round
const isPassenger = computed(() => booking.value?.passenger_id === userId.value);
const target = computed(() => {
  const current = booking.value;

  if (!current) {
    return null;
  }

  return isPassenger.value ?
    { id: current.driver_id, name: current.driver_name, avatarUrl: current.driver_avatar_url, role: 'o condutor' } :
    { id: current.passenger_id, name: current.passenger_name, avatarUrl: current.passenger_avatar_url, role: 'o passageiro' };
});
const canReview = computed(() => booking.value?.status === 'completed' || booking.value?.status === 'no_show');
const tagOptions = computed(() => REVIEW_TAGS.filter(tag => isPassenger.value || tag.forPassenger));

const rating = ref(0);
const tags = ref<string[]>([]);
const comment = ref('');
const isSending = ref(false);
const errorText = ref<string | null>(null);

function toggleTag(value: string) {
  tags.value = tags.value.includes(value) ? tags.value.filter(tag => tag !== value) : [...tags.value, value];
}

async function send() {
  if (rating.value < 1) {
    errorText.value = 'Escolha de 1 a 5 estrelas.';

    return;
  }

  isSending.value = true;
  errorText.value = null;

  try {
    await submitReview(bookingId, rating.value, tags.value, comment.value.trim() || undefined);
    toast.add({ title: 'Obrigado pela avaliação', color: 'success', icon: 'i-lucide-check' });
    await refresh();
  } catch (error) {
    errorText.value = messageFor(error);
  } finally {
    isSending.value = false;
  }
}

const backLink = computed(() => (isPassenger.value ? `/conta/reservas/${bookingId}` : `/conta/viagens/${booking.value?.trip_id ?? ''}`));
</script>

<template>
  <UContainer class="max-w-lg py-8">
    <UAlert
      v-if="!booking || !target"
      color="neutral"
      variant="soft"
      icon="i-lucide-ticket-x"
      title="Viagem não encontrada"
      description="A ligação pode estar errada ou a viagem pertence a outra conta."
    />

    <template v-else>
      <p class="text-sm text-muted">
        {{ booking.origin_name }} para {{ booking.destination_name }} · {{ formatDay(booking.departure_at) }}
      </p>

      <h1 class="mt-1 text-2xl font-semibold">
        Avaliar {{ target.role }}
      </h1>

      <div class="mt-5 flex items-center gap-3">
        <UAvatar
          :src="target.avatarUrl ?? undefined"
          :alt="target.name"
          icon="i-lucide-user-round"
          size="xl"
        />

        <NuxtLink
          :to="`/perfil/${target.id}`"
          class="text-lg font-medium hover:underline"
        >
          {{ target.name }}
        </NuxtLink>
      </div>

      <UCard
        v-if="ownReview"
        class="mt-5"
      >
        <p class="flex items-center gap-2 font-semibold">
          <UIcon
            name="i-lucide-circle-check"
            class="size-5 text-success"
          />
          Já avaliou esta viagem
        </p>

        <div class="mt-3">
          <ReviewStars :rating="ownReview.rating" />
        </div>

        <p
          v-if="ownReview.comment"
          class="mt-2 whitespace-pre-wrap text-sm"
        >
          {{ ownReview.comment }}
        </p>

        <div
          v-if="ownReview.tags.length"
          class="mt-2 flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="tag in ownReview.tags"
            :key="tag"
            color="neutral"
            variant="subtle"
          >
            {{ reviewTagLabel(tag) }}
          </UBadge>
        </div>

        <p class="mt-3 text-sm text-muted">
          {{ ownReview.is_visible ? 'A avaliação está pública no perfil.' : 'Fica pública quando a outra pessoa também avaliar ou 14 dias depois da viagem.' }}
        </p>

        <UButton
          class="mt-4"
          :to="backLink"
          variant="soft"
          color="neutral"
        >
          Voltar
        </UButton>
      </UCard>

      <UAlert
        v-else-if="!canReview"
        class="mt-5"
        color="neutral"
        variant="soft"
        icon="i-lucide-clock"
        title="Ainda não pode avaliar"
        description="A avaliação fica disponível quando a viagem estiver concluída."
      />

      <UCard
        v-else
        class="mt-5"
      >
        <div class="flex flex-col items-center gap-2">
          <ReviewStars
            v-model:rating="rating"
            isInput
          />

          <p class="text-sm text-muted">
            {{ rating ? `${rating} de 5 estrelas` : 'Toque nas estrelas para avaliar' }}
          </p>
        </div>

        <div class="mt-5">
          <p class="text-sm font-medium">
            O que correu bem
          </p>

          <div class="mt-2 flex flex-wrap gap-2">
            <UButton
              v-for="tag in tagOptions"
              :key="tag.value"
              size="sm"
              :variant="tags.includes(tag.value) ? 'solid' : 'outline'"
              :color="tags.includes(tag.value) ? 'primary' : 'neutral'"
              @click="toggleTag(tag.value)"
            >
              {{ tag.label }}
            </UButton>
          </div>
        </div>

        <UFormField
          class="mt-5"
          label="Comentário"
          :help="`Opcional. ${comment.length}/${REVIEW_COMMENT_MAX}`"
        >
          <UTextarea
            v-model="comment"
            :rows="3"
            :maxlength="REVIEW_COMMENT_MAX"
            placeholder="Como foi a viagem?"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="errorText"
          class="mt-4"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="errorText"
        />

        <UButton
          class="mt-5"
          size="lg"
          block
          icon="i-lucide-send"
          :loading="isSending"
          @click="send"
        >
          Enviar avaliação
        </UButton>

        <p class="mt-2 text-center text-xs text-muted">
          Pode avaliar até 14 dias depois da viagem. A avaliação não pode ser alterada.
        </p>
      </UCard>
    </template>
  </UContainer>
</template>
