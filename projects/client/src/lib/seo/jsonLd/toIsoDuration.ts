/** Minutes as an ISO 8601 duration, `PT2H28M`; undefined when there are none. */
export function toIsoDuration(minutes: number | null | undefined): string | undefined {
  if (!minutes || minutes <= 0 || !Number.isFinite(minutes)) return undefined;
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return `PT${hours ? `${hours}H` : ''}${rest || !hours ? `${rest}M` : ''}`;
}
