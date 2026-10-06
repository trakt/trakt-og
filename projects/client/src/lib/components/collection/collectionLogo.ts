const logos: Record<string, string> = import.meta.glob('../../icons/logos/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// OG's per-logo sizes (`.logos-icon-bluray`, `.logos-icon-dolby_digital` and friends).
const WIDE = new Set(['bluray', 'vcd']);
const SMALL = new Set([
  'digital',
  'dolby_digital',
  'dolby_digital_plus',
  'dolby_prologic',
  'dolby_atmos',
  'dolby_truehd',
  'dts',
  'dts_ma',
  'dts_x',
]);

/** A `logos` icon's SVG and OG's size class for it, or undefined when there's no such logo. */
export function collectionLogo(name: string): { svg: string; size?: 'wide' | 'small' } | undefined {
  const svg = logos[`../../icons/logos/${name}.svg`];
  if (!svg) return undefined;
  return { svg, size: WIDE.has(name) ? 'wide' : SMALL.has(name) ? 'small' : undefined };
}
