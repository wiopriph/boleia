import type { Tables } from '~~/types/rpc';


export type NotificationRow = Pick<Tables<'notifications'>, 'id' | 'type' | 'payload' | 'read_at' | 'created_at'>;

export interface NotificationView {
  title: string
  body: string | null
  // route and day of the trip the notification is about; null for money, account and old rows
  context: string | null
  icon: string
  to: string | null
}

type Payload = Record<string, unknown>;
type NotificationText = Pick<NotificationView, 'title' | 'icon'> & { body?: string | null };

function text(payload: Payload, key: string): string | null {
  const value = payload[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function money(payload: Payload, key: string): string | null {
  const value = payload[key];

  return typeof value === 'number' && value > 0 ? formatKz(value) : null;
}

function clock(payload: Payload, key: string): string | null {
  const value = text(payload, key);

  return value && !Number.isNaN(Date.parse(value)) ? formatTime(value) : null;
}

function seats(payload: Payload): string | null {
  return typeof payload.seats === 'number' && payload.seats > 0 ? seatsLabel(payload.seats) : null;
}

// "qua, 25 nov, 08:00": until when the passenger can rate or dispute
function deadline(payload: Payload): string | null {
  const value = text(payload, 'respond_until');

  return value && !Number.isNaN(Date.parse(value)) ? formatDateTime(value) : null;
}

function refundLine(payload: Payload): string | null {
  const amount = money(payload, 'refund_kz');

  return amount ? `Reembolso de ${amount}.` : null;
}

const DISPUTE_OUTCOMES: Record<string, string> = {
  completed: 'A viagem foi dada como feita.',
  no_show: 'Ficou registado que o passageiro não embarcou.',
  refund_full: 'O valor é devolvido ao passageiro.',
  refund_partial: 'Parte do valor é devolvida ao passageiro.',
};

// In-app texts per notification type (spec section 9): the title says who and what, the body adds the
// number or the next step. Unknown types fall back to a neutral line.
const TEXTS: Record<string, (payload: Payload) => NotificationText> = {
  payment_pending: payload => ({
    title: `Confirme o pagamento${money(payload, 'amount_kz') ? ` de ${money(payload, 'amount_kz')}` : ''}.`,
    body: 'Na Multicaixa Express, em 15 minutos.',
    icon: 'i-lucide-credit-card',
  }),
  payment_paid: payload => ({
    title: `Pagamento${money(payload, 'amount_kz') ? ` de ${money(payload, 'amount_kz')}` : ''} recebido.`,
    icon: 'i-lucide-circle-check',
  }),
  payment_failed: payload => ({
    title: 'O pagamento não foi concluído.',
    body: cancelReasonText(text(payload, 'reason')),
    icon: 'i-lucide-circle-x',
  }),
  booking_requested: (payload) => {
    const name = text(payload, 'passenger_name');
    const count = seats(payload);

    return {
      title: name && count ? `${name} pediu ${count}.` : 'Novo pedido de reserva pago.',
      body: 'Responda em 24 horas.',
      icon: 'i-lucide-ticket',
    };
  },
  booking_confirmed: (payload) => {
    const name = text(payload, 'passenger_name');
    const count = seats(payload);

    return {
      title: name && count ? `${name} reservou ${count}.` : 'Nova reserva confirmada na sua viagem.',
      icon: 'i-lucide-ticket-check',
    };
  },
  booking_accepted: () => ({
    title: 'Reserva aceite.',
    body: 'O PIN e o contacto chegam 2 horas antes.',
    icon: 'i-lucide-circle-check',
  }),
  booking_declined: payload => ({ title: 'O condutor recusou o pedido.', body: refundLine(payload), icon: 'i-lucide-circle-x' }),
  booking_expired: payload => ({ title: 'O condutor não respondeu.', body: refundLine(payload), icon: 'i-lucide-clock-alert' }),
  booking_cancelled_by_passenger: (payload) => {
    const count = typeof payload.seats === 'number' ? payload.seats : 1;

    return {
      title: 'Um passageiro cancelou.',
      body: count > 1 ? `${seatsLabel(count)} voltaram a estar livres.` : 'O lugar voltou a estar livre.',
      icon: 'i-lucide-user-x',
    };
  },
  booking_cancelled_by_driver: payload => ({
    title: 'O condutor cancelou a sua reserva.',
    body: refundLine(payload),
    icon: 'i-lucide-circle-x',
  }),
  booking_no_show: () => ({
    title: 'Não embarcou.',
    body: 'Reserva fechada sem reembolso.',
    icon: 'i-lucide-user-x',
  }),
  trip_cancelled: (payload) => {
    // the refund wording belongs to the passenger; the driver only learns who cancelled
    const driverBody = text(payload, 'reason') === 'moderation' ? 'A viagem foi retirada pela Boleia.' : null;

    return {
      title: 'Viagem cancelada.',
      body: payload.role === 'driver' ? driverBody : refundLine(payload) ?? cancelReasonText(text(payload, 'reason')),
      icon: 'i-lucide-ban',
    };
  },
  refund_done: payload => ({
    title: `Reembolso${money(payload, 'refund_kz') ? ` de ${money(payload, 'refund_kz')}` : ''} enviado.`,
    icon: 'i-lucide-undo-2',
  }),
  new_message: (payload) => {
    const sender = text(payload, 'sender_name');

    return {
      title: sender ? `${sender}:` : 'Nova mensagem.',
      body: text(payload, 'preview'),
      icon: 'i-lucide-message-circle',
    };
  },
  trip_reminder_24h: (payload) => {
    const time = clock(payload, 'departure_at');

    return {
      title: time ? `A viagem é amanhã às ${time}.` : 'A viagem é amanhã.',
      body: payload.action === 'confirm_trip_intent' ? 'Confirme que vai fazer a viagem.' : null,
      icon: 'i-lucide-calendar-clock',
    };
  },
  trip_reminder_6h: (payload) => {
    const time = clock(payload, 'departure_at');

    return {
      title: time ? `Partida às ${time}.` : 'Faltam 6 horas para a partida.',
      body: time ? 'Faltam 6 horas. Confirme que vai fazer a viagem.' : 'Confirme que vai fazer a viagem.',
      icon: 'i-lucide-alarm-clock',
    };
  },
  trip_reminder_2h: (payload) => {
    const time = clock(payload, 'departure_at');

    return {
      title: time ? `Partida às ${time}.` : 'Faltam 2 horas para a partida.',
      body: time ? 'Faltam 2 horas.' : null,
      icon: 'i-lucide-alarm-clock',
    };
  },
  pin_ready: (payload) => {
    const until = clock(payload, 'wait_until');

    return {
      title: 'O PIN de embarque e o contacto já estão disponíveis.',
      body: until ? `O condutor espera até às ${until}.` : null,
      icon: 'i-lucide-key-round',
    };
  },
  driver_unconfirmed: () => ({
    title: 'O condutor ainda não confirmou a viagem.',
    body: 'Pode cancelar com reembolso total.',
    icon: 'i-lucide-triangle-alert',
  }),
  // the two entries below are no longer sent (boleia-db 0025); old rows in the feed still need a text
  driver_arrived: () => ({ title: 'O condutor chegou.', icon: 'i-lucide-map-pin-check' }),
  trip_completed_ask: () => ({ title: 'A viagem terminou.', icon: 'i-lucide-thumbs-up' }),
  trip_started_without_you: payload => ({
    title: 'A viagem começou sem si.',
    body: deadline(payload) ? `Se estava no local, conteste até ${deadline(payload)}.` : 'Se estava no local, conteste em 24 horas.',
    icon: 'i-lucide-user-x',
  }),
  trip_finished: payload => ({
    title: payload.by_system === true ? 'A viagem foi dada como concluída.' : 'Viagem concluída.',
    body: deadline(payload) ? `Avalie ou conteste até ${deadline(payload)}.` : 'Avalie ou conteste em 24 horas.',
    icon: 'i-lucide-flag',
  }),
  trip_start_reminder: () => ({
    title: 'Já partiu?',
    body: 'Inicie a viagem para registar quem embarcou.',
    icon: 'i-lucide-play',
  }),
  trip_auto_closed: payload => ({
    title: 'Fechámos a viagem por si.',
    body: payload.step === 'finish' ? 'Não concluiu a viagem na aplicação.' : 'Não iniciou a viagem na aplicação.',
    icon: 'i-lucide-timer-off',
  }),
  dispute_opened: payload => ({
    title: 'O passageiro contestou a viagem.',
    body: [disputeReasonLabel(text(payload, 'reason')), 'A moderação vai analisar.'].filter(Boolean).join('. '),
    icon: 'i-lucide-scale',
  }),
  dispute_resolved: payload => ({
    title: 'A moderação decidiu a disputa.',
    body: DISPUTE_OUTCOMES[text(payload, 'outcome') ?? ''] ?? null,
    icon: 'i-lucide-scale',
  }),
  payout_released: payload => ({
    title: money(payload, 'amount_kz') ? `+${money(payload, 'amount_kz')} na sua carteira.` : 'Novo valor na sua carteira.',
    icon: 'i-lucide-wallet',
  }),
  payout_paid: payload => ({
    title: `Levantamento${money(payload, 'amount_kz') ? ` de ${money(payload, 'amount_kz')}` : ''} pago.`,
    icon: 'i-lucide-banknote',
  }),
  payout_failed: payload => ({
    title: `Levantamento${money(payload, 'amount_kz') ? ` de ${money(payload, 'amount_kz')}` : ''} falhou.`,
    body: 'O valor voltou à carteira.',
    icon: 'i-lucide-circle-x',
  }),
  verification_approved: () => ({
    title: 'Verificação aprovada.',
    body: 'Já aparece como condutor verificado.',
    icon: 'i-lucide-badge-check',
  }),
  verification_rejected: payload => ({
    title: 'Verificação recusada.',
    body: text(payload, 'reason') ? `Motivo: ${text(payload, 'reason')}` : 'Veja o motivo e envie de novo.',
    icon: 'i-lucide-badge-x',
  }),
  review_request: () => ({ title: 'Como correu a viagem?', body: 'Deixe a sua avaliação.', icon: 'i-lucide-star' }),
  moderation_action: payload => ({
    title: 'A moderação tomou uma decisão sobre a sua conta.',
    body: text(payload, 'reason') ? `Motivo: ${text(payload, 'reason')}` : null,
    icon: 'i-lucide-shield-alert',
  }),
  // sent to admins only
  payout_requested: payload => ({
    title: money(payload, 'amount_kz') ? `Novo pedido de levantamento: ${money(payload, 'amount_kz')}.` : 'Novo pedido de levantamento.',
    icon: 'i-lucide-wallet',
  }),
  verification_submitted: () => ({ title: 'Novos documentos de condutor para analisar.', icon: 'i-lucide-file-check' }),
  report_opened: () => ({ title: 'Nova denúncia para analisar.', icon: 'i-lucide-flag' }),
  refund_manual: payload => ({
    title: money(payload, 'refund_kz') ? `Reembolso manual por fazer: ${money(payload, 'refund_kz')}.` : 'Reembolso manual por fazer.',
    icon: 'i-lucide-undo-2',
  }),
  reconciliation_alert: () => ({
    title: 'Alerta de reconciliação.',
    body: 'Há diferenças entre os registos e os pagamentos.',
    icon: 'i-lucide-triangle-alert',
  }),
};

// The type to screen table is the contract in boleia-db docs/api.md ("Куда ведёт уведомление").
const ADMIN_ROUTES: Record<string, string> = {
  payout_requested: '/admin/levantamentos',
  verification_submitted: '/admin/verificacoes',
  report_opened: '/admin/denuncias',
  refund_manual: '/admin/dinheiro',
  reconciliation_alert: '/admin/dinheiro',
};

const DRIVER_TYPES = new Set([
  'booking_requested',
  'booking_confirmed',
  'booking_cancelled_by_passenger',
  'trip_reminder_6h',
  'trip_reminder_2h',
  'trip_start_reminder',
  'trip_auto_closed',
]);
const WALLET_TYPES = new Set(['payout_released', 'payout_paid', 'payout_failed']);
const VERIFICATION_TYPES = new Set(['verification_approved', 'verification_rejected']);

function linkFor(type: string, payload: Payload): string | null {
  const adminRoute = ADMIN_ROUTES[type];

  if (adminRoute) {
    return adminRoute;
  }

  if (WALLET_TYPES.has(type)) {
    return '/conta/carteira';
  }

  if (VERIFICATION_TYPES.has(type)) {
    return '/conta/condutor';
  }

  const conversationId = text(payload, 'conversation_id');
  const bookingId = text(payload, 'booking_id');
  const tripId = text(payload, 'trip_id');

  if (conversationId) {
    return `/conta/mensagens/${conversationId}`;
  }

  if (type === 'review_request' && bookingId) {
    return `/avaliar/${bookingId}`;
  }

  // the same event goes to both sides: role (boleia-db 0024) says which screen is the recipient's
  if (tripId && (payload.role === 'driver' || DRIVER_TYPES.has(type))) {
    return `/conta/viagens/${tripId}`;
  }

  if (bookingId) {
    return `/conta/reservas/${bookingId}`;
  }

  return tripId ? `/conta/viagens/${tripId}` : null;
}

function contextFor(payload: Payload): string | null {
  const origin = text(payload, 'origin_name');
  const destination = text(payload, 'destination_name');

  if (!origin || !destination) {
    return null;
  }

  const departure = text(payload, 'departure_at');
  const day = departure && !Number.isNaN(Date.parse(departure)) ? ` · ${formatDay(departure)}` : '';

  return `${origin} para ${destination}${day}`;
}

export function notificationView(notification: NotificationRow): NotificationView {
  const payload = (notification.payload && typeof notification.payload === 'object' && !Array.isArray(notification.payload) ?
    notification.payload :
    {}) as Payload;
  const content = TEXTS[notification.type]?.(payload) ?? { title: 'Tem uma atualização.', icon: 'i-lucide-bell' };

  return {
    title: content.title,
    body: content.body ?? null,
    context: contextFor(payload),
    icon: content.icon,
    to: linkFor(notification.type, payload),
  };
}
