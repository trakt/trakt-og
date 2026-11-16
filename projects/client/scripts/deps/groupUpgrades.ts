import type { Upgrade } from './Upgrade.ts';

const scopeOf = (key: string) => (key.startsWith('@') ? key.slice(0, key.indexOf('/')) : undefined);

// Packages of one npm scope that sit on the same version and move to the same one are a family released together
// (@tiptap/*), and are only compatible with each other at one version. A family moves, reverts and is reported as one unit.
// Everything else is a unit of its own.
export function groupUpgrades(upgrades: ReadonlyArray<Upgrade>): ReadonlyArray<ReadonlyArray<Upgrade>> {
  const units = new Map<string, Array<Upgrade>>();

  upgrades.forEach((upgrade) => {
    const scope = scopeOf(upgrade.pin.key);
    const id = scope ? `${scope}@${upgrade.pin.version}>${upgrade.to}` : upgrade.pin.key;
    units.set(id, [...(units.get(id) ?? []), upgrade]);
  });

  return [...units.values()];
}
