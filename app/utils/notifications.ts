import type { Tables } from '~~/types/rpc';


export type NotificationRow = Pick<Tables<'notifications'>, 'id' | 'type' | 'payload' | 'read_at' | 'created_at'>;

interface NotificationView {
  title: string
  icon: string
  to: string | null
}

type Payload = Record<string, unknown>;

function linkFor(payload: Payload): string | null {
  if (typeof payload.conversation_id === 'string') {
    return `/conta/mensagens/${payload.conversation_id}`;
  }

  if (typeof payload.booking_id === 'string') {
    return `/conta/reservas/${payload.booking_id}`;
  }

  if (typeof payload.trip_id === 'string') {
    return `/conta/viagens/${payload.trip_id}`;
  }

  return null;
}

function money(payload: Payload, key: string): string {
  return typeof payload[key] === 'number' ? formatKz(payload[key] as number) : '';
}

// In-app texts per notification type (spec section 9). Unknown types fall back to a neutral line.
const TEXTS: Record<string, (payload: Payload) => Omit<NotificationView, 'to'>> = {
  payment_pending: payload => ({ title: `Confirme o pagamento de ${money(payload, 'amount_kz')} na Multicaixa Express`, icon: 'i-lucide-credit-card' }),
  payment_paid: payload => ({ title: `Pagamento de ${money(payload, 'amount_kz')} recebido`, icon: 'i-lucide-circle-check' }),
  payment_failed: payload => ({ title: cancelReasonText(String(payload.reason ?? '')) ?? 'O pagamento não foi concluído', icon: 'i-lucide-circle-x' }),
  booking_requested: () => ({ title: 'Novo pedido de reserva pago. Responda em 24 horas', icon: 'i-lucide-ticket' }),
  booking_confirmed: () => ({ title: 'Nova reserva confirmada na sua viagem', icon: 'i-lucide-ticket-check' }),
  booking_accepted: () => ({ title: 'Reserva aceite. O PIN e o contacto chegam 2 horas antes', icon: 'i-lucide-circle-check' }),
  booking_declined: payload => ({ title: `O condutor recusou o pedido. Reembolso de ${money(payload, 'refund_kz')}`, icon: 'i-lucide-circle-x' }),
  booking_expired: payload => ({ title: `O condutor não respondeu. Reembolso de ${money(payload, 'refund_kz')}`, icon: 'i-lucide-clock-alert' }),
  booking_cancelled_by_passenger: () => ({ title: 'Um passageiro cancelou. O lugar voltou a estar livre', icon: 'i-lucide-user-x' }),
  booking_cancelled_by_driver: payload => ({ title: `O condutor cancelou a sua reserva. Reembolso de ${money(payload, 'refund_kz')}`, icon: 'i-lucide-circle-x' }),
  booking_no_show: () => ({ title: 'O condutor indicou que não compareceu. Reserva fechada sem reembolso', icon: 'i-lucide-user-x' }),
  trip_cancelled: payload => ({ title: payload.refund_kz ? `Viagem cancelada. Reembolso de ${money(payload, 'refund_kz')}` : 'Viagem cancelada', icon: 'i-lucide-ban' }),
  refund_done: payload => ({ title: `Reembolso de ${money(payload, 'refund_kz')} enviado`, icon: 'i-lucide-undo-2' }),
  refund_manual: payload => ({ title: `Reembolso de ${money(payload, 'refund_kz')} em processamento manual`, icon: 'i-lucide-undo-2' }),
  new_message: () => ({ title: 'Nova mensagem', icon: 'i-lucide-message-circle' }),
  trip_reminder_24h: () => ({ title: 'A viagem é amanhã. Confirme os detalhes', icon: 'i-lucide-calendar-clock' }),
  trip_reminder_6h: () => ({ title: 'Faltam 6 horas. Confirme que vai fazer a viagem', icon: 'i-lucide-alarm-clock' }),
  trip_reminder_2h: () => ({ title: 'Faltam 2 horas para a partida', icon: 'i-lucide-alarm-clock' }),
  pin_ready: () => ({ title: 'O PIN de embarque e o contacto já estão disponíveis', icon: 'i-lucide-key-round' }),
  driver_unconfirmed: () => ({ title: 'O condutor ainda não confirmou a viagem. Pode cancelar com reembolso total', icon: 'i-lucide-triangle-alert' }),
  driver_arrived: () => ({ title: 'O condutor chegou ao ponto de encontro', icon: 'i-lucide-map-pin-check' }),
  trip_completed_ask: () => ({ title: 'Chegou bem? Confirme a viagem', icon: 'i-lucide-thumbs-up' }),
  dispute_opened: () => ({ title: 'Foi aberta uma disputa nesta viagem. A moderação vai analisar', icon: 'i-lucide-scale' }),
  dispute_resolved: () => ({ title: 'A moderação decidiu a disputa', icon: 'i-lucide-scale' }),
  payout_released: payload => ({ title: `+${money(payload, 'amount_kz')} na sua carteira`, icon: 'i-lucide-wallet' }),
  payout_requested: () => ({ title: 'Pedido de levantamento recebido', icon: 'i-lucide-wallet' }),
  payout_paid: payload => ({ title: `Levantamento de ${money(payload, 'amount_kz')} pago`, icon: 'i-lucide-banknote' }),
  payout_failed: payload => ({ title: `Levantamento de ${money(payload, 'amount_kz')} falhou. O valor voltou à carteira`, icon: 'i-lucide-circle-x' }),
  verification_submitted: () => ({ title: 'Documentos recebidos. A análise demora até 12 horas', icon: 'i-lucide-file-check' }),
  verification_approved: () => ({ title: 'Verificação aprovada. Já aparece como condutor verificado', icon: 'i-lucide-badge-check' }),
  verification_rejected: () => ({ title: 'Verificação recusada. Veja o motivo e envie de novo', icon: 'i-lucide-badge-x' }),
  review_request: () => ({ title: 'Como correu a viagem? Deixe a sua avaliação', icon: 'i-lucide-star' }),
  moderation_action: () => ({ title: 'A moderação tomou uma decisão sobre a sua conta', icon: 'i-lucide-shield-alert' }),
};

const DRIVER_TYPES = new Set(['booking_requested', 'booking_confirmed', 'booking_cancelled_by_passenger', 'trip_reminder_6h']);
const WALLET_TYPES = new Set(['payout_released', 'payout_requested', 'payout_paid', 'payout_failed']);
const VERIFICATION_TYPES = new Set(['verification_submitted', 'verification_approved', 'verification_rejected']);

export function notificationView(notification: NotificationRow): NotificationView {
  const payload = (notification.payload ?? {}) as Payload;
  const text = TEXTS[notification.type]?.(payload) ?? { title: 'Tem uma atualização', icon: 'i-lucide-bell' };

  let to = linkFor(payload);

  if (notification.type === 'review_request' && typeof payload.booking_id === 'string') {
    to = `/avaliar/${payload.booking_id}`;
  } else if (DRIVER_TYPES.has(notification.type) && typeof payload.trip_id === 'string') {
    to = `/conta/viagens/${payload.trip_id}`;
  } else if (WALLET_TYPES.has(notification.type)) {
    to = '/conta/carteira';
  } else if (VERIFICATION_TYPES.has(notification.type)) {
    to = '/conta/condutor';
  }

  return { ...text, to };
}
