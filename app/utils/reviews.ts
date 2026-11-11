import type { Enums } from '~~/types/rpc';


export const REVIEW_COMMENT_MAX = 300;

// the backend accepts exactly these tags (TAGS_INVALID otherwise)
export const REVIEW_TAGS = [
  { value: 'pontual', label: 'Pontual', forPassenger: true },
  { value: 'condução_segura', label: 'Condução segura', forPassenger: false },
  { value: 'simpático', label: 'Simpático', forPassenger: true },
] as const;

export function reviewTagLabel(tag: string): string {
  return REVIEW_TAGS.find(item => item.value === tag)?.label ?? tag;
}

export const REPORT_REASONS: { value: Enums<'report_reason'>, label: string }[] = [
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'unsafe_driving', label: 'Condução perigosa' },
  { value: 'harassment', label: 'Assédio ou insultos' },
  { value: 'scam', label: 'Tentativa de burla' },
  { value: 'cash_offer', label: 'Pediu pagamento fora da Boleia' },
  { value: 'wrong_price', label: 'Preço diferente do anunciado' },
  { value: 'other', label: 'Outro motivo' },
];

export function cancelBadgeLabel(badge: string | null): string | null {
  if (badge === 'never_cancelled') {
    return 'Nunca cancelou';
  }

  if (badge === 'sometimes_cancels') {
    return 'Às vezes cancela';
  }

  return null;
}

// only the decade is shown, never the exact year
export function ageGroupLabel(birthYear: number | null): string | null {
  if (!birthYear) {
    return null;
  }

  const age = new Date().getFullYear() - birthYear;

  if (age < 18 || age > 100) {
    return null;
  }

  const decade = Math.floor(age / 10) * 10;

  return decade < 20 ? '18-19 anos' : `${decade}-${decade + 9} anos`;
}
