import type { Enums, ModerationAction } from '~~/types/rpc';


const PROFILE_STATUS: Record<Enums<'profile_status'>, string> = {
  active: 'Ativa',
  restricted: 'Restringida',
  suspended: 'Suspensa',
  banned: 'Banida',
  deleted: 'Apagada',
};

export function profileStatusLabel(status: Enums<'profile_status'>, suspendedUntil?: string | null): string {
  return status === 'suspended' && suspendedUntil ?
    `${PROFILE_STATUS.suspended} até ${formatDateTime(suspendedUntil)}` :
    PROFILE_STATUS[status];
}

const DRIVER_STATUS: Record<Enums<'driver_status'>, string> = {
  none: 'Sem pedido de verificação',
  pending: 'Verificação pendente',
  verified: 'Condutor verificado',
  rejected: 'Verificação recusada',
};

export function driverStatusLabel(status: Enums<'driver_status'>): string {
  return DRIVER_STATUS[status];
}

const REPORT_STATUS: Record<Enums<'report_status'>, string> = {
  open: 'Aberta',
  reviewed: 'Em análise',
  actioned: 'Com ação aplicada',
  dismissed: 'Arquivada',
};

export function reportStatusLabel(status: Enums<'report_status'>): string {
  return REPORT_STATUS[status];
}

export function reportReasonLabel(reason: Enums<'report_reason'>): string {
  return REPORT_REASONS.find(item => item.value === reason)?.label ?? reason;
}

const VERIFICATION_STATUS: Record<Enums<'verification_status'>, string> = {
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Recusada',
};

export function verificationStatusLabel(status: Enums<'verification_status'>): string {
  return VERIFICATION_STATUS[status];
}

const MOD_ACTION: Record<Enums<'mod_action'>, string> = {
  warn: 'Aviso',
  restrict: 'Restrição',
  suspend: 'Suspensão',
  ban: 'Banimento',
  unban: 'Conta reativada',
  verify_id: 'Verificação aprovada',
  resolve_dispute: 'Disputa resolvida',
  hide_trip: 'Viagem retirada',
  cancel_booking: 'Reserva cancelada',
  manual_refund: 'Reembolso manual',
  report_dismissed: 'Denúncia arquivada',
};

export function modActionLabel(action: Enums<'mod_action'>): string {
  return MOD_ACTION[action];
}

const PAYMENT_STATUS: Record<Enums<'payment_status'>, string> = {
  created: 'Criado',
  pending: 'À espera de confirmação',
  paid: 'Pago',
  failed: 'Falhado',
  expired: 'Expirado',
  refunded: 'Reembolsado',
  partially_refunded: 'Reembolsado em parte',
};

export function paymentStatusLabel(status: Enums<'payment_status'>): string {
  return PAYMENT_STATUS[status];
}

const BOOKING_STATUS: Record<Enums<'booking_status'>, string> = {
  pending_payment: 'À espera de pagamento',
  payment_failed: 'Pagamento falhado',
  requested: 'À espera do condutor',
  accepted: 'Aceite',
  declined: 'Recusada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
  awaiting_confirm: 'À espera de confirmação da chegada',
  completed: 'Concluída',
  no_show: 'Passageiro não apareceu',
  disputed: 'Em disputa',
};

// neutral wording for the admin; the passenger and driver texts live in booking-status and trip-status
export function bookingStatusLabel(status: Enums<'booking_status'>): string {
  return BOOKING_STATUS[status];
}

const LEDGER_ACCOUNT: Record<Enums<'ledger_account'>, string> = {
  passenger_escrow: 'Valor retido',
  driver_balance: 'Saldo do condutor',
  platform_fee: 'Taxa de serviço',
  refunds: 'Reembolsos',
  gateway_fees: 'Comissões do meio de pagamento',
  cash_out: 'Saída de dinheiro',
  cash_in: 'Entrada de dinheiro',
};

export function ledgerAccountLabel(account: Enums<'ledger_account'>): string {
  return LEDGER_ACCOUNT[account];
}

export interface ModerationChoice {
  action: ModerationAction
  label: string
  description: string
  isDestructive: boolean
}

export const MODERATION_CHOICES: ModerationChoice[] = [
  { action: 'warn', label: 'Avisar', description: 'O utilizador recebe um aviso com o motivo. A conta continua ativa.', isDestructive: false },
  { action: 'restrict', label: 'Restringir', description: 'O utilizador deixa de poder fazer reservas até a conta ser reativada.', isDestructive: true },
  { action: 'suspend', label: 'Suspender', description: 'A conta fica suspensa durante os dias indicados e as sessões são terminadas.', isDestructive: true },
  { action: 'ban', label: 'Banir', description: 'A conta e o número ficam banidos. As viagens e reservas ativas são canceladas com reembolso total.', isDestructive: true },
  { action: 'unban', label: 'Reativar conta', description: 'A conta volta a ficar ativa e o número deixa de estar banido.', isDestructive: false },
];
