<script setup lang="ts">
import type { Enums, UpdateTripPayload } from '~~/types/rpc';
import type { DriverTrip } from '~/composables/useDriverTrips';


const props = defineProps<{ trip: DriverTrip }>();
const emit = defineEmits<{ changed: [] }>();

const { updateTrip, cancelTrip, createReturnTrip } = useDriverTrips();
const { messageFor } = useBoleiaError();
const toast = useToast();

const isEditable = computed(() => props.trip.status === 'published' || props.trip.status === 'full');

// --- edit: only changed keys are sent, update_trip rejects locked ones with a code
const isEditOpen = ref(false);
const isSaving = ref(false);
const editError = ref<string | null>(null);
const edit = reactive({
  price: 0,
  seats: 1,
  date: '',
  time: '',
  bookingMode: 'instant' as Enums<'booking_mode'>,
  waitMinutes: 30,
  notes: '',
});

function openEdit() {
  edit.price = props.trip.price_per_seat_kz;
  edit.seats = props.trip.seats_offered;
  edit.date = toLuandaDateString(props.trip.departure_at);
  edit.time = formatTime(props.trip.departure_at);
  edit.bookingMode = props.trip.booking_mode;
  edit.waitMinutes = props.trip.wait_minutes;
  edit.notes = props.trip.notes ?? '';
  editError.value = null;
  isEditOpen.value = true;
}

async function saveEdit() {
  const payload: UpdateTripPayload = {};

  if (edit.price !== props.trip.price_per_seat_kz) {
    payload.price_per_seat_kz = edit.price;
  }

  if (edit.seats !== props.trip.seats_offered) {
    payload.seats_offered = edit.seats;
  }

  const departureAt = toLuandaIso(edit.date, edit.time);

  if (new Date(departureAt).getTime() !== new Date(props.trip.departure_at).getTime()) {
    payload.departure_at = departureAt;
  }

  if (edit.bookingMode !== props.trip.booking_mode) {
    payload.booking_mode = edit.bookingMode;
  }

  if (edit.waitMinutes !== props.trip.wait_minutes) {
    payload.wait_minutes = edit.waitMinutes as 30 | 45 | 60;
  }

  if (edit.notes.trim() !== (props.trip.notes ?? '')) {
    payload.notes = edit.notes.trim();
  }

  if (!Object.keys(payload).length) {
    isEditOpen.value = false;

    return;
  }

  isSaving.value = true;
  editError.value = null;

  try {
    await updateTrip(props.trip.id, payload);
    toast.add({ title: 'Viagem atualizada', color: 'success', icon: 'i-lucide-check' });
    isEditOpen.value = false;
    emit('changed');
  } catch (error) {
    editError.value = messageFor(error);
  } finally {
    isSaving.value = false;
  }
}

// --- cancel
const isCancelOpen = ref(false);
const isCancelling = ref(false);
const cancelReason = ref('');
const cancelError = ref<string | null>(null);

async function confirmCancel() {
  isCancelling.value = true;
  cancelError.value = null;

  try {
    await cancelTrip(props.trip.id, cancelReason.value.trim() || undefined);
    toast.add({ title: 'Viagem cancelada', description: 'Os passageiros são reembolsados na totalidade.', color: 'success', icon: 'i-lucide-check' });
    isCancelOpen.value = false;
    emit('changed');
  } catch (error) {
    cancelError.value = messageFor(error);
  } finally {
    isCancelling.value = false;
  }
}

// --- return trip
const isReturnOpen = ref(false);
const isCreatingReturn = ref(false);
const returnError = ref<string | null>(null);
const returnTrip = reactive({ date: '', time: '15:00' });

function openReturn() {
  returnTrip.date = addDays(toLuandaDateString(props.trip.departure_at), 1);
  returnError.value = null;
  isReturnOpen.value = true;
}

async function confirmReturn() {
  isCreatingReturn.value = true;
  returnError.value = null;

  try {
    const newTripId = await createReturnTrip(props.trip.id, toLuandaIso(returnTrip.date, returnTrip.time));

    toast.add({ title: 'Viagem de regresso publicada', color: 'success', icon: 'i-lucide-check' });
    isReturnOpen.value = false;
    await navigateTo(`/conta/viagens/${newTripId}`);
  } catch (error) {
    returnError.value = messageFor(error);
  } finally {
    isCreatingReturn.value = false;
  }
}

const modeItems = [
  { value: 'instant', label: 'Reserva imediata' },
  { value: 'approval', label: 'Confirmo cada pedido' },
];
const waitItems = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      v-if="isEditable"
      variant="soft"
      color="neutral"
      icon="i-lucide-pencil"
      @click="openEdit"
    >
      Editar
    </UButton>

    <UButton
      variant="soft"
      color="neutral"
      icon="i-lucide-repeat"
      @click="openReturn"
    >
      Criar viagem de regresso
    </UButton>

    <UButton
      v-if="isEditable"
      :to="`/viagem/${trip.id}`"
      variant="soft"
      color="neutral"
      icon="i-lucide-eye"
    >
      Ver página pública
    </UButton>

    <UButton
      v-if="isEditable"
      variant="ghost"
      color="error"
      icon="i-lucide-ban"
      @click="isCancelOpen = true"
    >
      Cancelar viagem
    </UButton>

    <UModal
      v-model:open="isEditOpen"
      title="Editar viagem"
      description="Preço, lugares e nota só mudam enquanto não há reservas pagas; a hora só enquanto não há reservas."
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Preço por lugar (Kz)">
              <UInputNumber
                v-model="edit.price"
                :min="500"
                :max="100000"
                :step="500"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Lugares">
              <UInputNumber
                v-model="edit.seats"
                :min="1"
                :max="Math.min(4, trip.vehicle?.seats_total ?? 4)"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Data">
              <UInput
                v-model="edit.date"
                type="date"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Hora">
              <UInput
                v-model="edit.time"
                type="time"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Reservas">
            <USelect
              v-model="edit.bookingMode"
              :items="modeItems"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Espera por atrasos">
            <USelect
              v-model="edit.waitMinutes"
              :items="waitItems"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nota">
            <UTextarea
              v-model="edit.notes"
              :rows="2"
              maxlength="500"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="editError"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :description="editError"
          />
        </div>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isEditOpen = false"
        >
          Cancelar
        </UButton>

        <UButton
          :loading="isSaving"
          @click="saveEdit"
        >
          Guardar
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isCancelOpen"
      title="Cancelar esta viagem?"
      description="Todas as reservas são canceladas e os passageiros recebem o valor inteiro de volta. O cancelamento fica registado no seu perfil."
    >
      <template #body>
        <UFormField
          label="Motivo"
          help="Opcional. Os passageiros vêem o motivo."
        >
          <UTextarea
            v-model="cancelReason"
            :rows="2"
            maxlength="200"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="cancelError"
          class="mt-3"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="cancelError"
        />
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isCancelOpen = false"
        >
          Manter viagem
        </UButton>

        <UButton
          color="error"
          :loading="isCancelling"
          @click="confirmCancel"
        >
          Cancelar viagem
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isReturnOpen"
      title="Viagem de regresso"
      :description="`${trip.destination?.name} para ${trip.origin?.name}, com o mesmo veículo, preço e opções.`"
    >
      <template #body>
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Data">
            <UInput
              v-model="returnTrip.date"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Hora">
            <UInput
              v-model="returnTrip.time"
              type="time"
              class="w-full"
            />
          </UFormField>
        </div>

        <UAlert
          v-if="returnError"
          class="mt-3"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :description="returnError"
        />
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          @click="isReturnOpen = false"
        >
          Cancelar
        </UButton>

        <UButton
          :loading="isCreatingReturn"
          @click="confirmReturn"
        >
          Publicar regresso
        </UButton>
      </template>
    </UModal>
  </div>
</template>
