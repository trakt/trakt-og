import type { Upgrade } from './Upgrade.ts';

// What a unit is called in reports: its package, or `@scope/*` for a family.
export function unitName(unit: ReadonlyArray<Upgrade>): string {
  const [first] = unit;
  if (!first) return '';
  if (unit.length === 1) return first.pin.key;
  return `${first.pin.key.slice(0, first.pin.key.indexOf('/'))}/*`;
}
