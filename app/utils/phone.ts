// Angolan numbers: 9 digits starting with 9. GoTrue wants "244900000005" (no plus), profiles keep E.164.
const LOCAL_RE = /^9\d{8}$/;

export function normalizeLocalPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '').replace(/^00244|^244/, '');

  return LOCAL_RE.test(digits) ? digits : null;
}

const LOCAL_LENGTH = 9;

// Digits of the country code at the start of what was typed or pasted ("244...", "00244...").
// A local number starts with 9, so these prefixes are never part of it.
export function countryPrefixLength(digits: string): number {
  if (digits.startsWith('00244')) {
    return 5;
  }

  return digits.startsWith('244') ? 3 : 0;
}

// Local digits of the phone field: no country code, nothing but digits, at most 9.
export function localPhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  const start = countryPrefixLength(digits);

  return digits.slice(start, start + LOCAL_LENGTH);
}

// "923 456 789": the mask of the phone field
export function groupPhoneDigits(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}

export function toAuthPhone(local: string): string {
  return `244${local}`;
}

// "+244 900 000 005"
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }

  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('244') ? digits.slice(3) : digits;

  return `+244 ${local.replace(/(\d{3})(?=\d)/g, '$1 ')}`.trim();
}
