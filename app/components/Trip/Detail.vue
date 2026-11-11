<script setup lang="ts">
import type { TripPublic } from '~/composables/useTrip';


const props = defineProps<{ trip: TripPublic }>();

const userId = useUserId();
const isOwnTrip = computed(() => !!userId.value && userId.value === props.trip.driver_id);
const arrival = computed(() => arrivalAt(props.trip.departure_at, props.trip.duration_minutes));

const shareTitle = computed(() => `Boleia ${props.trip.origin_name} para ${props.trip.destination_name}, ${formatDay(props.trip.departure_at)}`);

const options = computed(() => {
  const list = [{ icon: 'i-lucide-briefcase', text: luggageLabel(props.trip.luggage) }];

  if (props.trip.max_two_in_back) {
    list.push({ icon: 'i-lucide-armchair', text: 'Máximo 2 pessoas no banco de trás' });
  }

  return list;
});
</script>

<template>
  <UContainer class="py-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm text-muted">
          {{ formatDayLong(trip.departure_at) }}
        </p>

        <h1 class="mt-1 text-2xl font-semibold">
          {{ trip.origin_name }} <span class="text-muted">para</span> {{ trip.destination_name }}
        </h1>
      </div>

      <TripShareButton
        :tripId="trip.id"
        :title="shareTitle"
      />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div class="space-y-6">
        <UCard>
          <ol class="relative space-y-6 border-s-2 border-default ps-5">
            <li class="relative">
              <span class="absolute -start-[1.6rem] top-1.5 size-3 rounded-full border-2 border-primary bg-default" />

              <p class="text-lg font-semibold tabular-nums">
                {{ formatTime(trip.departure_at) }}
              </p>

              <p class="font-medium">
                {{ trip.origin_name }}
              </p>

              <p
                v-if="trip.origin_detail"
                class="text-sm text-muted"
              >
                Ponto de encontro: {{ trip.origin_detail }}
              </p>
            </li>

            <li class="relative">
              <span class="absolute -start-[1.6rem] top-1.5 size-3 rounded-full bg-primary" />

              <p class="text-lg font-semibold tabular-nums">
                {{ arrival ? formatTime(arrival) : 'Hora de chegada estimada indisponível' }}
              </p>

              <p class="font-medium">
                {{ trip.destination_name }}
              </p>

              <p
                v-if="trip.destination_detail"
                class="text-sm text-muted"
              >
                Chegada: {{ trip.destination_detail }}
              </p>
            </li>
          </ol>

          <USeparator class="my-5" />

          <ul class="grid gap-3 text-sm sm:grid-cols-2">
            <li
              v-if="trip.duration_minutes"
              class="flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-clock"
                class="size-4 text-muted"
              />
              Cerca de {{ formatDuration(trip.duration_minutes) }} de viagem
            </li>

            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-timer"
                class="size-4 text-muted"
              />
              O condutor espera até {{ trip.wait_minutes }} min por atrasos
            </li>

            <li class="flex items-start gap-2 sm:col-span-2">
              <UIcon
                :name="trip.booking_mode === 'instant' ? 'i-lucide-zap' : 'i-lucide-message-square-reply'"
                class="mt-0.5 size-4 text-muted"
              />

              <span>
                <span class="font-medium">{{ bookingModeLabel(trip.booking_mode) }}.</span>
                {{ bookingModeHint(trip.booking_mode) }}
              </span>
            </li>

            <li
              v-for="option in options"
              :key="option.text"
              class="flex items-center gap-2"
            >
              <UIcon
                :name="option.icon"
                class="size-4 text-muted"
              />
              {{ option.text }}
            </li>
          </ul>

          <p
            v-if="trip.notes"
            class="mt-5 rounded-lg bg-elevated p-3 text-sm"
          >
            {{ trip.notes }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Condutor
            </h2>
          </template>

          <NuxtLink
            :to="`/perfil/${trip.driver_id}`"
            class="flex items-center gap-4"
          >
            <UAvatar
              :src="trip.driver_avatar_url ?? undefined"
              :alt="trip.driver_name ?? ''"
              icon="i-lucide-user-round"
              size="xl"
            />

            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1.5 font-medium">
                {{ trip.driver_name }}
                <UIcon
                  v-if="trip.driver_verified"
                  name="i-lucide-badge-check"
                  class="size-4 text-primary"
                  aria-label="Condutor verificado"
                />
              </p>

              <p class="text-sm text-muted">
                <UIcon
                  name="i-lucide-star"
                  class="size-3.5 align-text-bottom"
                />
                {{ ratingLabel(trip.driver_rating_avg, trip.driver_rating_count) }}
                · {{ tripsCountLabel(trip.driver_trips_driven) }} como condutor
              </p>
            </div>

            <UIcon
              name="i-lucide-chevron-right"
              class="size-5 text-muted"
            />
          </NuxtLink>

          <UAlert
            v-if="!trip.driver_verified"
            class="mt-4"
            color="warning"
            variant="soft"
            icon="i-lucide-shield-alert"
            title="Condutor não verificado"
            description="Os documentos deste condutor ainda não foram verificados. O pagamento fica protegido até ao fim da viagem."
          />

          <p
            v-else
            class="mt-4 text-sm text-muted"
          >
            Documento, carta de condução e veículo verificados pela Boleia.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Veículo
            </h2>
          </template>

          <div class="flex items-center gap-4">
            <div class="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated">
              <img
                v-if="trip.vehicle_photo_url"
                :src="trip.vehicle_photo_url"
                :alt="`${trip.vehicle_make} ${trip.vehicle_model}`"
                class="h-full w-full object-cover"
              >

              <UIcon
                v-else
                name="i-lucide-car"
                class="size-8 text-muted"
              />
            </div>

            <div>
              <p class="font-medium">
                {{ trip.vehicle_make }} {{ trip.vehicle_model }}
                <UBadge
                  v-if="trip.vehicle_verified"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  icon="i-lucide-badge-check"
                  class="ms-1 align-middle"
                >
                  Verificado
                </UBadge>
              </p>

              <p
                v-if="trip.vehicle_color"
                class="text-sm text-muted capitalize"
              >
                {{ trip.vehicle_color }}
              </p>

              <p class="text-sm text-muted">
                A matrícula é partilhada 2 horas antes da viagem.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <aside class="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <TripBookingBox
          :trip="trip"
          :isOwnTrip="isOwnTrip"
        />

        <TripAskDriver
          v-if="!isOwnTrip"
          :trip="trip"
        />

        <HomePaymentProtected isCompact />
      </aside>
    </div>
  </UContainer>
</template>
