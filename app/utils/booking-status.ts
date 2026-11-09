import type { Enums, SystemCancelReason, Views } from '~~/types/rpc';


export type BookingRow = Views<'my_bookings'>;

export interface StatusText {
  label: string
  // money or next step in words and digits, never color alone
  detail: string
  tone: 'neutral' | 'primary' | 'success' | 'warning' | 'error'
}

export function cancelReasonText(reason: string | null | undefined): string | null {
  const texts: Record<SystemCancelReason, string> = {
    PAYMENT_PHONE_MISMATCH: 'O pagamento veio de outro número Multicaixa Express. O valor é devolvido automaticamente.',
    payment_expired: 'O tempo para pagar acabou e o lugar foi libertado.',
    trip_departed: 'A viagem partiu sem o pagamento concluído.',
    trip_cancelled: 'O condutor cancelou a viagem.',
    no_response: 'O condutor não respondeu a tempo. O valor é devolvido na totalidade.',
    dispute_refund: 'A moderação decidiu devolver o valor.',
    driver_no_show: 'O condutor não apareceu. O valor é devolvido na totalidade.',
    moderation: 'A viagem foi retirada pela Boleia. O valor é devolvido na totalidade.',
  };

  return reason && reason in texts ? texts[reason as SystemCancelReason] : null;
}

// Passenger wording for a booking; money comes from the view, nothing is computed here.
export function bookingStatusText(booking: BookingRow): StatusText {
  const paid = formatKz(booking.paid_total_kz);
  const refund = formatKz(booking.refund_kz);
  const status = booking.status as Enums<'booking_status'>;

  switch (status) {
    case 'pending_payment':
      return { label: 'Aguarda pagamento', detail: `${paid} a pagar`, tone: 'warning' };
    case 'payment_failed':
      return { label: 'Pagamento não concluído', detail: cancelReasonText(booking.cancel_reason) ?? 'Pode tentar pagar de novo.', tone: 'error' };
    case 'requested':
      return { label: 'À espera do condutor', detail: `${paid} retidos até à resposta`, tone: 'primary' };
    case 'accepted':
      return { label: 'Lugar confirmado', detail: `${paid} retidos até ao fim da viagem`, tone: 'success' };
    case 'declined':
      return { label: 'Recusada pelo condutor', detail: `Reembolso de ${refund}`, tone: 'neutral' };
    case 'expired':
      return { label: 'Sem resposta do condutor', detail: `Reembolso de ${refund}`, tone: 'neutral' };
    case 'cancelled':
      return {
        label: booking.cancelled_by === 'passenger' ? 'Cancelada por si' : 'Cancelada',
        detail: booking.refund_kz > 0 ? `Reembolso de ${refund}` : 'Sem reembolso',
        tone: 'neutral',
      };
    case 'awaiting_confirm':
      return { label: 'Viagem em curso', detail: `${paid} retidos até confirmar a chegada`, tone: 'primary' };
    case 'completed':
      return { label: 'Concluída', detail: 'Pagamento entregue ao condutor', tone: 'success' };
    case 'no_show':
      return { label: 'Não compareceu', detail: 'Sem reembolso', tone: 'error' };
    case 'disputed':
      return { label: 'Em análise pela moderação', detail: `${paid} retidos até à decisão`, tone: 'warning' };
    default:
      return { label: status, detail: '', tone: 'neutral' };
  }
}
