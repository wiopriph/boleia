// Integer kwanzas only, thousands separated by a regular space: "8 000 Kz".
export function formatKz(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return '';
  }

  const sign = amount < 0 ? '-' : '';
  const digits = Math.abs(Math.trunc(amount)).toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${sign}${digits} Kz`;
}
