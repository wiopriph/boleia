// The only text dictionary in the app: BOLEIA_<CODE> from RPC (docs/api.md in boleia-db) -> pt-AO.
// Edge functions return the same codes without the prefix.

export const BOLEIA_ERRORS: Record<string, string> = {
  AMOUNT_INVALID: 'Montante inválido.',
  ARRIVAL_WINDOW_CLOSED: 'Só pode marcar a chegada entre 3 horas antes da partida e o fim do tempo de espera.',
  BALANCE_NOT_ZERO: 'Levante o saldo da carteira antes de apagar a conta.',
  BOOKING_CLOSED: 'Esta reserva já está fechada.',
  BOOKING_DUPLICATE: 'Já tem uma reserva nesta viagem.',
  BOOKING_LIMIT_REACHED: 'Já tem 3 reservas ativas. Conclua ou cancele uma antes de reservar outra.',
  BOOKING_NOT_FOUND: 'Reserva não encontrada.',
  CHAT_CLOSED: 'Esta conversa está fechada.',
  CHAT_LIMIT_REACHED: 'Limite de conversas atingido. Reserve um lugar para continuar a falar com o condutor.',
  CONTACT_LOCKED: 'O contacto fica disponível 2 horas antes da partida.',
  DAYS_REQUIRED: 'Indique o número de dias.',
  DEPARTURE_TOO_SOON: 'A partida tem de ser daqui a pelo menos 2 horas.',
  DISPUTE_AMOUNT_INVALID: 'Montante do reembolso inválido.',
  DISPUTE_OUTCOME_INVALID: 'Decisão inválida.',
  DRIVER_LIMIT_REACHED: 'Já tem 5 viagens ativas. Conclua ou cancele uma antes de publicar outra.',
  HAS_ACTIVE_BOOKINGS: 'Tem reservas ou viagens ativas. Conclua-as antes de apagar a conta.',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente.',
  LEDGER_IMMUTABLE: 'Operação não permitida.',
  LEDGER_UNBALANCED: 'Operação não permitida.',
  MESSAGE_EMPTY: 'Escreva uma mensagem.',
  MESSAGE_TOO_LONG: 'Mensagem demasiado longa.',
  MODERATION_ACTION_INVALID: 'Ação de moderação inválida.',
  NAME_INVALID: 'O nome tem de ter entre 2 e 40 caracteres.',
  NOT_ADMIN: 'Sem permissão.',
  NOT_AUTHENTICATED: 'Inicie sessão para continuar.',
  NOT_PARTICIPANT: 'Não participa nesta viagem.',
  NO_SHOW_NEEDS_PIN: 'Só pode marcar falta depois de introduzir o PIN de outro passageiro. Sem PIN, o caso vai para moderação.',
  NO_SHOW_TOO_EARLY: 'Ainda está dentro do tempo de espera. Aguarde o fim do tempo combinado.',
  NO_SHOW_WINDOW_CLOSED: 'Já não é possível marcar falta nesta reserva.',
  OWN_TRIP: 'Não pode reservar na sua própria viagem.',
  PAYMENT_NOT_FOUND: 'Pagamento não encontrado.',
  PAYMENT_PENDING: 'Há um pagamento em curso. Aguarde a confirmação.',
  PAYMENT_REF_MISMATCH: 'Pagamento não reconhecido. Contacte o apoio.',
  PAYMENT_RETRY_LIMIT: 'Limite de tentativas de pagamento atingido para esta reserva.',
  PAYMENT_STATUS_INVALID: 'Este pagamento já não pode ser alterado.',
  PAYOUT_CLOSED: 'Este levantamento já está fechado.',
  PAYOUT_METHOD_INVALID: 'Método de levantamento inválido. Indique um número Multicaixa Express (+244) ou um IBAN de 25 caracteres com o banco.',
  PAYOUT_NOT_FOUND: 'Levantamento não encontrado.',
  PAYOUT_PENDING: 'Já tem um levantamento em curso.',
  PAYOUT_STATUS_INVALID: 'Estado do levantamento inválido.',
  PIN_INVALID: 'PIN incorreto.',
  PIN_WINDOW_CLOSED: 'O PIN já não pode ser introduzido nesta reserva.',
  PLACE_INVALID: 'Escolha uma cidade da lista.',
  PLACE_NOT_FOUND: 'Local não encontrado.',
  PLACE_SLUG_TAKEN: 'Já existe um local com este identificador.',
  PRICE_INVALID: 'O preço por lugar tem de estar entre 500 Kz e 100 000 Kz.',
  PROFILE_INCOMPLETE: 'Complete o perfil: nome, fotografia e método de levantamento.',
  PROFILE_NOT_FOUND: 'Perfil não encontrado.',
  PROFILE_RESTRICTED: 'A sua conta está limitada. Contacte o apoio.',
  PROTECTED_FIELD: 'Este campo não pode ser alterado.',
  RATE_LIMITED: 'Demasiadas tentativas. Aguarde alguns minutos.',
  RATING_INVALID: 'Escolha de 1 a 5 estrelas.',
  REASON_REQUIRED: 'Indique o motivo.',
  REPORT_CLOSED: 'Esta denúncia já está fechada.',
  REPORT_NOT_FOUND: 'Denúncia não encontrada.',
  REPORT_OUTCOME_INVALID: 'Decisão inválida.',
  REVIEW_DUPLICATE: 'Já avaliou esta viagem.',
  REVIEW_WINDOW_CLOSED: 'O prazo de 14 dias para avaliar já passou.',
  SAME_PLACE: 'A origem e o destino têm de ser diferentes.',
  SEATS_INVALID: 'Número de lugares inválido.',
  TAGS_INVALID: 'Etiquetas inválidas.',
  TARGET_INVALID: 'Utilizador inválido.',
  TARGET_IS_ADMIN: 'Não é possível aplicar esta ação a um administrador.',
  TOO_LATE_TO_CANCEL: 'Já não é possível cancelar: a viagem está prestes a partir ou já partiu.',
  TRIP_CLOSED: 'Esta viagem já está fechada.',
  TRIP_DUPLICATE: 'Já tem uma viagem neste trajeto a menos de 2 horas desta hora.',
  TRIP_FIELD_LOCKED: 'Este campo já não pode ser alterado porque há reservas.',
  TRIP_FULL: 'Já não há lugares suficientes nesta viagem.',
  TRIP_HAS_BOOKINGS: 'A viagem tem reservas pagas. Cancele a viagem para devolver o dinheiro.',
  TRIP_NOT_BOOKABLE: 'Esta viagem já não aceita reservas.',
  TRIP_NOT_FOUND: 'Viagem não encontrada.',
  VEHICLE_INCOMPLETE: 'Indique marca, modelo e número de lugares do veículo.',
  VEHICLE_LIMIT_REACHED: 'Limite de veículos atingido.',
  VEHICLE_NOT_FOUND: 'Veículo não encontrado.',
  VERIFICATION_CLOSED: 'Esta verificação já foi decidida.',
  VERIFICATION_INCOMPLETE: 'Envie os quatro documentos: BI, carta de condução, fotografia do veículo com matrícula e selfie.',
  VERIFICATION_PENDING: 'Já tem um pedido de verificação em análise.',
  WAIT_INVALID: 'Tempo de espera inválido: 30, 45 ou 60 minutos.'
}

export const GENERIC_ERROR = 'Algo correu mal. Tente novamente.'
export const OFFLINE_ERROR = 'Sem ligação. Verifique a internet e tente novamente.'

export function errorText(code: string | null | undefined): string {
  if (!code) return GENERIC_ERROR
  return BOLEIA_ERRORS[code] ?? GENERIC_ERROR
}

// Auth errors raised by the client itself (GoTrue has no BOLEIA_ codes).
Object.assign(BOLEIA_ERRORS, {
  OTP_SEND_FAILED: 'Não foi possível enviar o código. Verifique o número e tente novamente.',
  OTP_INVALID: 'Código incorreto ou expirado. Peça um novo código.'
})
