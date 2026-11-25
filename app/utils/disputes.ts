import type { DisputeReason } from '~~/types/rpc';


// open_dispute reasons (boleia-db 0025): one list after a finished trip, another after "the trip left without you"
export const DISPUTE_REASONS_AFTER_TRIP: { value: DisputeReason, label: string }[] = [
  { value: 'not_arrived', label: 'Não cheguei ao destino' },
  { value: 'left_midway', label: 'O condutor deixou-me antes do destino' },
  { value: 'unsafe', label: 'A condução foi perigosa' },
  { value: 'other', label: 'Outro problema' },
];

export const DISPUTE_REASONS_NOT_BOARDED: { value: DisputeReason, label: string }[] = [
  { value: 'was_there', label: 'Estive no ponto de encontro e o condutor não me levou' },
  { value: 'driver_left_early', label: 'O condutor partiu antes da hora' },
  { value: 'other', label: 'Outro problema' },
];

export const DISPUTE_DETAILS_MIN = 5;
export const DISPUTE_DETAILS_MAX = 500;

export function disputeReasonLabel(reason: string | null | undefined): string | null {
  const found = [...DISPUTE_REASONS_AFTER_TRIP, ...DISPUTE_REASONS_NOT_BOARDED].find(item => item.value === reason);

  return found?.label ?? null;
}
