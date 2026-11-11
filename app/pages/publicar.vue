<script setup lang="ts">
import type { Enums, PublishTripPayload } from '~~/types/rpc';


definePageMeta({ middleware: 'auth' });
useSeoMeta({ title: 'Publicar viagem', robots: 'noindex' });

const { profile, load: loadProfile } = useProfile();
const { vehicles, load: loadVehicles } = useVehicles();
const { cities, landmarks, ensureLoaded: loadPlaces } = usePlaces();
const { fetchPriceHint, publishTrip } = useDriverTrips();
const { messageFor } = useBoleiaError();
const toast = useToast();

await useAsyncData('publicar', async () => {
  await Promise.all([loadProfile(), loadVehicles(), loadPlaces()]);

  return true;
});

const LAST_STEP = 5;
const STEP_TITLES = ['Rota', 'Data e hora', 'Lugares e preço', 'Opções', 'Rever e publicar'];
const MIN_PRICE = 500;
const MAX_PRICE = 100000;
const MAX_SEATS_PER_TRIP = 4;
const NOTES_MAX = 500;

const step = ref(1);
const stepError = ref<string | null>(null);
const isPublishing = ref(false);

const today = toLuandaDateString();

const form = reactive({
  origin: undefined as string | undefined,
  destination: undefined as string | undefined,
  originDetail: '',
  destinationDetail: '',
  date: today,
  time: '07:00',
  vehicleId: undefined as string | undefined,
  seats: 3,
  price: undefined as number | undefined,
  bookingMode: 'instant' as Enums<'booking_mode'>,
  waitMinutes: 30 as 30 | 45 | 60,
  luggage: 'medium' as Enums<'luggage_size'>,
  isMaxTwoInBack: false,
  notes: '',
});

watch(vehicles, (list) => {
  if (!form.vehicleId && list[0]) {
    form.vehicleId = list[0].id;
  }
}, { immediate: true });

const isProfileReady = computed(() => !!profile.value &&
  profile.value.display_name.trim().length >= 2 &&
  !!profile.value.avatar_url &&
  !!profile.value.payout_method);
const isVerified = computed(() => profile.value?.driver_status === 'verified');

const cityItems = computed(() => cities.value.map(place => ({
  label: place.name,
  value: place.slug,
  description: place.province !== place.name ? place.province : undefined,
  keywords: [place.name, place.province, ...(place.aliases ?? [])].join(' '),
})));

const originPlace = computed(() => cities.value.find(place => place.slug === form.origin) ?? null);
const destinationPlace = computed(() => cities.value.find(place => place.slug === form.destination) ?? null);
const vehicle = computed(() => vehicles.value.find(item => item.id === form.vehicleId) ?? null);

// landmarks are meeting points of a city, never trip endpoints
function landmarksOf(province: string | undefined) {
  return province ? landmarks.value.filter(place => place.province === province).map(place => place.name) : [];
}

const originLandmarks = computed(() => landmarksOf(originPlace.value?.province));
const destinationLandmarks = computed(() => landmarksOf(destinationPlace.value?.province));

const maxSeats = computed(() => Math.min(MAX_SEATS_PER_TRIP, vehicle.value?.seats_total ?? MAX_SEATS_PER_TRIP));

watch(maxSeats, (limit) => {
  if (form.seats > limit) {
    form.seats = limit;
  }
});

const vehicleItems = computed(() => vehicles.value.map(item => ({
  label: `${item.make} ${item.model}${item.color ? `, ${item.color}` : ''}`,
  value: item.id,
})));

const priceHint = ref<number | null>(null);

watch([originPlace, destinationPlace], async ([from, to]) => {
  priceHint.value = null;

  if (!from || !to || from.id === to.id) {
    return;
  }

  try {
    const hint = await fetchPriceHint(from.id, to.id);

    priceHint.value = hint?.price_hint_kz ?? null;

    if (form.price === undefined && priceHint.value) {
      form.price = priceHint.value;
    }
  } catch {
    priceHint.value = null;
  }
});

const departureIso = computed(() => toLuandaIso(form.date, form.time));

const modeItems = [
  { value: 'instant', label: 'Reserva imediata', description: 'O lugar fica confirmado assim que o passageiro paga.' },
  { value: 'approval', label: 'Confirmo cada pedido', description: 'Tem 24 horas para aceitar ou recusar cada pedido pago.' },
];
const waitItems = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];
const luggageItems = [
  { value: 'small', label: luggageLabel('small') },
  { value: 'medium', label: luggageLabel('medium') },
  { value: 'large', label: luggageLabel('large') },
];

function validate(current: number): string | null {
  if (current === 1) {
    if (!form.origin || !form.destination) {
      return 'Escolha a cidade de partida e a de chegada.';
    }

    if (form.origin === form.destination) {
      return 'A origem e o destino têm de ser diferentes.';
    }
  }

  if (current === 2) {
    if (!isValidDateString(form.date) || !/^\d{2}:\d{2}$/.test(form.time)) {
      return 'Indique a data e a hora de partida.';
    }

    if (new Date(departureIso.value).getTime() < Date.now() + 2 * 60 * 60 * 1000) {
      return 'A partida tem de ser daqui a pelo menos 2 horas.';
    }
  }

  if (current === 3) {
    if (!form.vehicleId) {
      return 'Escolha o veículo.';
    }

    if (form.seats < 1 || form.seats > maxSeats.value) {
      return `Pode oferecer de 1 a ${maxSeats.value} lugares.`;
    }

    if (!form.price || form.price < MIN_PRICE || form.price > MAX_PRICE) {
      return 'O preço por lugar tem de estar entre 500 Kz e 100 000 Kz.';
    }
  }

  if (current === 4 && form.notes.length > NOTES_MAX) {
    return 'A nota tem no máximo 500 caracteres.';
  }

  return null;
}

function next() {
  stepError.value = validate(step.value);

  if (!stepError.value && step.value < LAST_STEP) {
    step.value += 1;
  }
}

function back() {
  stepError.value = null;

  if (step.value > 1) {
    step.value -= 1;
  }
}

async function publish() {
  if (!originPlace.value || !destinationPlace.value || !form.vehicleId || !form.price) {
    return;
  }

  stepError.value = null;
  isPublishing.value = true;

  try {
    const payload: PublishTripPayload = {
      vehicle_id: form.vehicleId,
      origin_place_id: originPlace.value.id,
      destination_place_id: destinationPlace.value.id,
      origin_detail: form.originDetail.trim() || undefined,
      destination_detail: form.destinationDetail.trim() || undefined,
      departure_at: departureIso.value,
      seats_offered: form.seats,
      price_per_seat_kz: form.price,
      booking_mode: form.bookingMode,
      wait_minutes: form.waitMinutes,
      luggage: form.luggage,
      max_two_in_back: form.isMaxTwoInBack,
      notes: form.notes.trim() || undefined,
    };
    const result = await publishTrip(payload);

    toast.add({ title: 'Viagem publicada', color: 'success', icon: 'i-lucide-check' });
    await navigateTo(`/conta/viagens/${result.id}`);
  } catch (error) {
    stepError.value = messageFor(error);
  } finally {
    isPublishing.value = false;
  }
}
</script>

<template>
  <UContainer class="max-w-xl py-8">
    <h1 class="text-2xl font-semibold">
      Publicar viagem
    </h1>

    <UAlert
      v-if="!isProfileReady"
      class="mt-5"
      color="warning"
      variant="soft"
      icon="i-lucide-user-round-pen"
      title="Complete o perfil para publicar"
      description="Precisa de nome, fotografia e método de levantamento. Os passageiros vêem a sua fotografia e é para aí que enviamos o dinheiro."
    >
      <template #actions>
        <UButton
          to="/conta/perfil"
          color="warning"
          variant="soft"
        >
          Abrir o perfil
        </UButton>
      </template>
    </UAlert>

    <UAlert
      v-else-if="!vehicles.length"
      class="mt-5"
      color="warning"
      variant="soft"
      icon="i-lucide-car"
      title="Adicione um veículo"
      description="A viagem é publicada com um dos seus veículos."
    >
      <template #actions>
        <UButton
          to="/conta/perfil"
          color="warning"
          variant="soft"
        >
          Adicionar veículo
        </UButton>
      </template>
    </UAlert>

    <template v-else>
      <UAlert
        v-if="!isVerified"
        class="mt-5"
        color="neutral"
        variant="soft"
        icon="i-lucide-badge-check"
        title="Ainda não é condutor verificado"
        description="Pode publicar já. Com a verificação ganha o selo e aparece primeiro nos resultados."
      >
        <template #actions>
          <UButton
            to="/conta/condutor"
            color="neutral"
            variant="soft"
          >
            Verificar documentos
          </UButton>
        </template>
      </UAlert>

      <div class="mt-6">
        <p class="text-sm text-muted">
          Passo {{ step }} de {{ LAST_STEP }}
        </p>

        <h2 class="text-lg font-semibold">
          {{ STEP_TITLES[step - 1] }}
        </h2>

        <UProgress
          :modelValue="step"
          :max="LAST_STEP"
          class="mt-2"
          size="sm"
        />
      </div>

      <UCard class="mt-5">
        <div
          v-if="step === 1"
          class="space-y-5"
        >
          <UFormField label="De">
            <UInputMenu
              v-model="form.origin"
              :items="cityItems"
              valueKey="value"
              :filterFields="['label', 'keywords']"
              placeholder="Cidade de partida"
              icon="i-lucide-circle-dot"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Ponto de encontro"
            help="Onde os passageiros entram: terminal, praça, bomba de combustível."
          >
            <UInput
              v-model="form.originDetail"
              placeholder="Terminal Macon, Gamek"
              size="lg"
              class="w-full"
              maxlength="120"
            />

            <div
              v-if="originLandmarks.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <UButton
                v-for="name in originLandmarks"
                :key="name"
                size="xs"
                variant="outline"
                color="neutral"
                @click="form.originDetail = name"
              >
                {{ name }}
              </UButton>
            </div>
          </UFormField>

          <UFormField label="Para">
            <UInputMenu
              v-model="form.destination"
              :items="cityItems"
              valueKey="value"
              :filterFields="['label', 'keywords']"
              placeholder="Cidade de chegada"
              icon="i-lucide-map-pin"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Ponto de chegada">
            <UInput
              v-model="form.destinationDetail"
              placeholder="Terminal Rodoviário"
              size="lg"
              class="w-full"
              maxlength="120"
            />

            <div
              v-if="destinationLandmarks.length"
              class="mt-2 flex flex-wrap gap-1.5"
            >
              <UButton
                v-for="name in destinationLandmarks"
                :key="name"
                size="xs"
                variant="outline"
                color="neutral"
                @click="form.destinationDetail = name"
              >
                {{ name }}
              </UButton>
            </div>
          </UFormField>
        </div>

        <div
          v-else-if="step === 2"
          class="grid gap-5 sm:grid-cols-2"
        >
          <UFormField label="Data">
            <UInput
              v-model="form.date"
              type="date"
              :min="today"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Hora de partida"
            help="Hora de Luanda."
          >
            <UInput
              v-model="form.time"
              type="time"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <p class="text-sm text-muted sm:col-span-2">
            As reservas fecham 1 hora antes da partida. Pode publicar até 2 horas antes.
          </p>
        </div>

        <div
          v-else-if="step === 3"
          class="space-y-5"
        >
          <UFormField label="Veículo">
            <USelect
              v-model="form.vehicleId"
              :items="vehicleItems"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Lugares para passageiros"
            :help="`No máximo ${maxSeats} por viagem.`"
          >
            <UInputNumber
              v-model="form.seats"
              :min="1"
              :max="maxSeats"
              size="lg"
              class="w-40"
            />
          </UFormField>

          <UFormField
            label="Preço por lugar (Kz)"
            :help="priceHint ? `Sugestão para esta rota: ${formatKz(priceHint)}. O passageiro paga ainda a taxa de serviço; você recebe o preço inteiro.` : 'O passageiro paga ainda a taxa de serviço; você recebe o preço inteiro.'"
          >
            <UInputNumber
              v-model="form.price"
              :min="MIN_PRICE"
              :max="MAX_PRICE"
              :step="500"
              :formatOptions="{ useGrouping: false }"
              size="lg"
              class="w-48"
            />
          </UFormField>
        </div>

        <div
          v-else-if="step === 4"
          class="space-y-5"
        >
          <UFormField label="Como aceita reservas">
            <URadioGroup
              v-model="form.bookingMode"
              :items="modeItems"
              variant="card"
            />
          </UFormField>

          <UFormField
            label="Quanto tempo espera por atrasos"
            help="Depois deste tempo pode marcar o passageiro como falta."
          >
            <URadioGroup
              v-model="form.waitMinutes"
              :items="waitItems"
              orientation="horizontal"
            />
          </UFormField>

          <UFormField label="Bagagem">
            <USelect
              v-model="form.luggage"
              :items="luggageItems"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <USwitch
            v-model="form.isMaxTwoInBack"
            label="Máximo 2 pessoas no banco de trás"
            description="Mais conforto para quem viaja."
          />

          <UFormField
            label="Nota para os passageiros"
            :help="`Opcional. ${form.notes.length}/${NOTES_MAX}`"
          >
            <UTextarea
              v-model="form.notes"
              :rows="3"
              :maxlength="NOTES_MAX"
              placeholder="Paragem em Sumbe para almoço, ar condicionado..."
              class="w-full"
            />
          </UFormField>
        </div>

        <div v-else>
          <dl class="space-y-3 text-sm">
            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Rota
              </dt>

              <dd>
                <span class="font-medium">{{ originPlace?.name }} para {{ destinationPlace?.name }}</span>

                <span
                  v-if="form.originDetail || form.destinationDetail"
                  class="block text-muted"
                >{{ [form.originDetail, form.destinationDetail].filter(Boolean).join(' · ') }}</span>
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Partida
              </dt>

              <dd class="font-medium">
                {{ formatDayLong(departureIso) }}, {{ formatTime(departureIso) }}
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Veículo
              </dt>

              <dd>
                {{ vehicle?.make }} {{ vehicle?.model }}
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Lugares
              </dt>

              <dd>
                {{ seatsLabel(form.seats) }} a {{ formatKz(form.price) }} cada
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Reservas
              </dt>

              <dd>
                {{ bookingModeLabel(form.bookingMode) }} · espera {{ form.waitMinutes }} min
              </dd>
            </div>

            <div class="flex gap-3">
              <dt class="w-24 shrink-0 text-muted">
                Opções
              </dt>

              <dd>
                {{ luggageLabel(form.luggage) }}<template v-if="form.isMaxTwoInBack">
                  · máx. 2 atrás
                </template>
              </dd>
            </div>

            <div
              v-if="form.notes"
              class="flex gap-3"
            >
              <dt class="w-24 shrink-0 text-muted">
                Nota
              </dt>

              <dd class="whitespace-pre-wrap">
                {{ form.notes }}
              </dd>
            </div>
          </dl>

          <p class="mt-4 rounded-lg bg-elevated p-3 text-sm">
            Com todos os lugares vendidos recebe <span class="font-semibold">{{ formatKz((form.price ?? 0) * form.seats) }}</span> na carteira depois da viagem.
          </p>
        </div>

        <UAlert
          v-if="stepError"
          class="mt-5"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="stepError"
        />

        <div class="mt-6 flex items-center justify-between gap-3">
          <UButton
            v-if="step > 1"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            @click="back"
          >
            Voltar
          </UButton>

          <span v-else />

          <UButton
            v-if="step < LAST_STEP"
            size="lg"
            trailingIcon="i-lucide-arrow-right"
            @click="next"
          >
            Continuar
          </UButton>

          <UButton
            v-else
            size="lg"
            icon="i-lucide-send"
            :loading="isPublishing"
            @click="publish"
          >
            Publicar viagem
          </UButton>
        </div>
      </UCard>
    </template>
  </UContainer>
</template>
