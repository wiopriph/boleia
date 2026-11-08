// Angolan numbers: 9 digits starting with 9. GoTrue wants "244900000005" (no plus), profiles keep E.164.
const LOCAL_RE = /^9\d{8}$/

export function normalizeLocalPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '').replace(/^00244|^244/, '')
  return LOCAL_RE.test(digits) ? digits : null
}

export function toAuthPhone(local: string): string {
  return `244${local}`
}

// "+244 900 000 005"
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return ''
  const digits = e164.replace(/\D/g, '')
  const local = digits.startsWith('244') ? digits.slice(3) : digits
  return `+244 ${local.replace(/(\d{3})(?=\d)/g, '$1 ')}`.trim()
}
