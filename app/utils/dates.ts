// Backend stores timestamptz in UTC; everything is shown in Luanda time (UTC+1, no DST).
export const TIME_ZONE = 'Africa/Luanda';

const LOCALE = 'pt-PT';

type DateInput = string | number | Date;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatTime(value: DateInput): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(toDate(value));
}

// "seg., 12 nov."
export function formatDay(value: DateInput): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(toDate(value));
}

// "12 de novembro de 2026"
export function formatDateLong(value: DateInput): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toDate(value));
}

// "seg., 12 nov., 07:30"
export function formatDateTime(value: DateInput): string {
  return `${formatDay(value)}, ${formatTime(value)}`;
}

// Calendar date in Luanda as YYYY-MM-DD, for query strings and <input type="date">.
export function toLuandaDateString(value: DateInput = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(toDate(value));

  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }

  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
