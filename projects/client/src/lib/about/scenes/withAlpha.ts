/** A `#rrggbb` color at an opacity, as `rgba()` a canvas reads in every browser. Anything else comes back as is. */
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return hex;

  const [, r = '0', g = '0', b = '0'] = match;
  return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},${alpha})`;
}
