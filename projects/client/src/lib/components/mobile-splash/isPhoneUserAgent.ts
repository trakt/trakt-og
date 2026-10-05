/**
 * Whether the user agent is a phone. The splash words itself for a phone on a touch screen anyway; this covers the
 * cases with a mouse, like a browser's device mode, so they read "bigger screens" rather than "wider window".
 * Android tablets leave "Mobile" out of their user agent.
 */
export function isPhoneUserAgent(userAgent: string | null): boolean {
  return /iPhone|iPod|Android.*Mobile/i.test(userAgent ?? '');
}
