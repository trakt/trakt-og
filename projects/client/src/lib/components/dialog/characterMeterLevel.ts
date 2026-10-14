/** How close a field is to its character limit: amber under 100 left, red under 25. */
export function characterMeterLevel(left: number): 'ok' | 'warn' | 'full' {
  if (left < 25) return 'full';
  if (left < 100) return 'warn';
  return 'ok';
}
