import type { Enums } from '~~/types/rpc';


export type TimeOfDay = 'manha' | 'tarde' | 'noite';

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay, label: string, hint: string }[] = [
  { value: 'manha', label: 'Manhã', hint: '05:00 - 12:00' },
  { value: 'tarde', label: 'Tarde', hint: '12:00 - 18:00' },
  { value: 'noite', label: 'Noite', hint: '18:00 - 05:00' },
];

export function timeOfDay(departureAt: string): TimeOfDay {
  const hour = getLuandaHour(departureAt);

  if (hour >= 5 && hour < 12) {
    return 'manha';
  }

  if (hour >= 12 && hour < 18) {
    return 'tarde';
  }

  return 'noite';
}

export function arrivalAt(departureAt: string, durationMinutes: number | null): Date | null {
  if (!durationMinutes) {
    return null;
  }

  return new Date(new Date(departureAt).getTime() + durationMinutes * 60_000);
}

export function bookingModeLabel(mode: Enums<'booking_mode'>): string {
  return mode === 'instant' ? 'Reserva imediata' : 'Confirmação do condutor';
}

export function seatsLabel(seats: number): string {
  if (seats <= 0) {
    return 'Cheio';
  }

  return seats === 1 ? '1 lugar' : `${seats} lugares`;
}

export function ratingLabel(average: number | null, count: number | null): string {
  if (!count) {
    return 'Sem avaliações';
  }

  return `${Number(average ?? 0).toFixed(1)
    .replace('.', ',')} (${count})`;
}
