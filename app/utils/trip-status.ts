import type { Enums, Tables } from '~~/types/rpc';
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

export function tripStatusText(status: TripStatus) {
  return TRIP_STATUS[status];
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

  switch (booking.status) {
    case 'requested':
      return { label: 'Pedido pago, à espera da sua resposta', detail: `${earns} para si se aceitar`, tone: 'warning' };
    case 'accepted':
      return {
        label: booking.pin_entered_at ? 'A bordo, PIN confirmado' : 'Lugar confirmado',
        detail: `${earns} a receber depois da viagem`,
        tone: 'success',
      };
    case 'awaiting_confirm':
      return {
        label: booking.pin_entered_at ? 'A bordo, PIN confirmado' : 'À espera de confirmação',
        detail: `${earns} entram na carteira quando o passageiro confirmar ou no prazo automático`,
        tone: 'primary',
      };
    case 'completed':
      return { label: 'Concluída', detail: `${earns} na sua carteira`, tone: 'success' };
    case 'no_show':
      return { label: 'Não compareceu', detail: `${earns} na sua carteira`, tone: 'neutral' };
    case 'disputed':
      return { label: 'Em análise pela moderação', detail: `${earns} retidos até à decisão`, tone: 'warning' };
    case 'declined':
      return { label: 'Recusado por si', detail: 'O passageiro foi reembolsado', tone: 'neutral' };
    case 'expired':
      return { label: 'Expirou sem resposta', detail: 'O passageiro foi reembolsado', tone: 'neutral' };
    case 'cancelled':
      return {
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
  const parts = [rating, `${booking.passenger_trips_ridden} viagens`];

  if (booking.passenger_cancels_total > 0) {
    parts.push('às vezes cancela');
  }

  if (booking.passenger_no_shows > 0) {
    parts.push(`${booking.passenger_no_shows} faltas`);
  }

  return parts.join(' · ');
}
