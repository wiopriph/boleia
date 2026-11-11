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

// "quinta, 12 nov": pt-PT collapses day + short month into "12/11", so the parts are joined by hand
export function formatDay(value: DateInput): string {
  const date = toDate(value);
  const weekday = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: 'short' }).format(date);
  const day = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, month: 'short' }).format(date)
    .replace('.', '');

  return `${weekday}, ${day} ${month}`;
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

// Hour of day (0-23) in Luanda, for the time-of-day filter.
export function getLuandaHour(value: DateInput): number {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(toDate(value))
    .find(part => part.type === 'hour')?.value;

  return Number(hour ?? 0);
}

// "segunda-feira, 12 de novembro"
export function formatDayLong(value: DateInput): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(value));
}

export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days));

  return date.toISOString().slice(0, 10);
}

export function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// Luanda is UTC+1 all year, so a local date and time map to a fixed offset.
export function toLuandaIso(date: string, time: string): string {
  return `${date}T${time}:00+01:00`;
}

export function toLuandaTimeString(value: DateInput): string {
  return formatTime(value);
}
