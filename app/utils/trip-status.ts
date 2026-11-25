import type { BookingStage, Enums, Tables } from '~~/types/rpc';
import type { BookingRow, StatusText } from '~/utils/booking-status';


type TripStatus = Enums<'trip_status'>;

const TRIP_STATUS: Record<TripStatus, { label: string, tone: StatusText['tone'] }> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  published: { label: 'Publicada', tone: 'primary' },
  full: { label: 'Cheia', tone: 'success' },
  departed: { label: 'Em viagem', tone: 'primary' },
  completed: { label: 'Concluída', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
  expired: { label: 'Sem reservas', tone: 'neutral' },
};

type TripProgress = Pick<Tables<'trips'>, 'status' | 'started_at' | 'finished_at'>;

// A departed trip goes through three steps the status alone does not show: not started, running, finished.
export function tripStatusText(trip: TripProgress) {
  if (trip.status !== 'departed') {
    return TRIP_STATUS[trip.status];
  }

  if (!trip.started_at) {
    return { label: 'Por iniciar', tone: 'warning' as const };
  }

  return trip.finished_at ?
    { label: 'Concluída, a aguardar passageiros', tone: 'primary' as const } :
    TRIP_STATUS.departed;
}

// The driver's own reason is free text; a trip closed by the system carries a code instead.
export function tripCancelText(trip: Pick<Tables<'trips'>, 'cancel_reason'>): string | undefined {
  return trip.cancel_reason === 'trip_not_started' ?
    'Não iniciou a viagem na aplicação nas 24 horas depois da hora de partida. Os passageiros foram reembolsados na totalidade.' :
    trip.cancel_reason ?? undefined;
}

export function isUpcomingTrip(trip: Pick<Tables<'trips'>, 'status'>): boolean {
  return trip.status === 'published' || trip.status === 'full' || trip.status === 'departed';
}

// bookings a driver acts on or gets paid for; unpaid attempts stay out of the driver's list
const DRIVER_VISIBLE: Enums<'booking_status'>[] = [
  'requested', 'accepted', 'awaiting_confirm', 'completed', 'no_show', 'disputed', 'cancelled', 'declined', 'expired',
];

export function isVisibleToDriver(booking: BookingRow): boolean {
  return DRIVER_VISIBLE.includes(booking.status);
}

// Driver wording: the driver receives price_total_kz, the service fee is the platform's.
export function driverBookingStatusText(booking: BookingRow): StatusText {
  const earns = formatKz(booking.price_total_kz);
  const until = booking.respond_until ? formatDateTime(booking.respond_until) : null;

  switch (booking.stage as BookingStage) {
    case 'requested':
      return { label: 'Pedido pago, à espera da sua resposta', detail: `${earns} para si se aceitar`, tone: 'warning' };
    case 'accepted':
      return { label: 'Lugar confirmado', detail: `${earns} a receber depois da viagem`, tone: 'success' };
    case 'boarding':
      return { label: 'PIN por introduzir', detail: 'Peça o PIN ao passageiro quando ele entrar no carro.', tone: 'warning' };
    case 'on_board':
    case 'in_trip':
      return { label: 'A bordo, PIN confirmado', detail: `${earns} a receber depois da viagem`, tone: 'success' };
    case 'finished':
      return {
        label: 'À espera da avaliação do passageiro',
        detail: until ? `${earns} entram na carteira quando ele avaliar ou em ${until}` : `${earns} entram na carteira em 24 horas`,
        tone: 'primary',
      };
    case 'not_boarded':
      return {
        label: 'Não embarcou',
        detail: until ? `Pode contestar até ${until}. Depois, ${earns} entram na sua carteira.` : `${earns} entram na carteira em 24 horas`,
        tone: 'neutral',
      };
    case 'completed':
      return { label: 'Concluída', detail: `${earns} na sua carteira`, tone: 'success' };
    case 'no_show':
      return { label: 'Não embarcou', detail: `${earns} na sua carteira`, tone: 'neutral' };
    case 'disputed':
      return {
        label: 'Contestada pelo passageiro',
        detail: [disputeReasonLabel(booking.dispute_reason), `${earns} retidos até à decisão da moderação`].filter(Boolean).join('. '),
        tone: 'warning',
      };
    case 'declined':
      return { label: 'Recusado por si', detail: 'O passageiro foi reembolsado', tone: 'neutral' };
    case 'expired':
      return { label: 'Expirou sem resposta', detail: 'O passageiro foi reembolsado', tone: 'neutral' };
    case 'cancelled':
      return booking.cancel_reason === 'trip_not_started' ?
        { label: 'Viagem não realizada', detail: 'O passageiro foi reembolsado na totalidade', tone: 'neutral' } :
        {
          label: booking.cancelled_by === 'driver' ? 'Cancelada por si' : 'Cancelada pelo passageiro',
          detail: 'O lugar voltou a estar livre',
          tone: 'neutral',
        };
    default:
      return { label: booking.status, detail: '', tone: 'neutral' };
  }
}

export function passengerTrustLine(booking: BookingRow): string {
  const rating = booking.passenger_rating_count ?
    `${Number(booking.passenger_rating_avg).toFixed(1)
      .replace('.', ',')} (${booking.passenger_rating_count})` :
    'Sem avaliações';
  const parts = [rating, tripsCountLabel(booking.passenger_trips_ridden)];

  if (booking.passenger_cancels_total > 0) {
    parts.push('às vezes cancela');
  }

  if (booking.passenger_no_shows > 0) {
    parts.push(`${booking.passenger_no_shows} faltas`);
  }

  return parts.join(' · ');
}
