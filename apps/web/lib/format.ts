const WEI = 10n ** 18n

/**
 * Amounts arrive from the API as decimal strings because JSON has no bigint.
 * We keep them as strings all the way to display so nothing is ever rounded
 * through a float. MON is 18 decimals; the demo amounts are small, so six
 * significant fraction digits is plenty and trailing zeros are trimmed.
 */
export function formatMon(wei: string | bigint, maxFractionDigits = 6): string {
  let value: bigint
  try {
    value = typeof wei === 'bigint' ? wei : BigInt(wei)
  } catch {
    return '0'
  }

  const negative = value < 0n
  const abs = negative ? -value : value
  const whole = abs / WEI
  const fraction = abs % WEI
  const fractionText = fraction
    .toString()
    .padStart(18, '0')
    .slice(0, maxFractionDigits)
    .replace(/0+$/, '')

  const body = fractionText.length > 0 ? `${whole}.${fractionText}` : whole.toString()
  return negative ? `-${body}` : body
}

export function formatMonLabel(wei: string | bigint): string {
  return `${formatMon(wei)} MON`
}

/** 0x1234…abcd — enough to recognise a value without letting it dominate. */
export function shortHash(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const date = new Date(seconds * 1000)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "in 2 days" / "3 hours ago" — used for bond expiry, never for money. */
export function formatRelative(seconds: number, now = Math.floor(Date.now() / 1000)): string {
  const delta = seconds - now
  const abs = Math.abs(delta)
  const unit =
    abs < 90
      ? [Math.round(abs), 'second']
      : abs < 5400
        ? [Math.round(abs / 60), 'minute']
        : abs < 172800
          ? [Math.round(abs / 3600), 'hour']
          : [Math.round(abs / 86400), 'day']

  const [amount, name] = unit as [number, string]
  const plural = amount === 1 ? name : `${name}s`
  return delta >= 0 ? `in ${amount} ${plural}` : `${amount} ${plural} ago`
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** 3_000_000 -> "3.0M", 12_400 -> "12.4k". For counters, not money. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}
