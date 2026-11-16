import type { BisectResult } from './BisectResult.ts';
import { groupUpgrades } from './groupUpgrades.ts';
import type { Upgrade } from './Upgrade.ts';

interface BisectUpgradesParams {
  readonly candidates: ReadonlyArray<Upgrade>;
  // Applies the set on top of everything adopted so far and verifies it. On success the probe keeps the set
  // (the baseline rolls forward); on failure it reverts to the previous baseline.
  readonly probe: (set: ReadonlyArray<Upgrade>) => Promise<boolean>;
}

const EMPTY: BisectResult = { adopted: [], rejected: [] };

const merge = (a: BisectResult, b: BisectResult): BisectResult => ({
  adopted: [...a.adopted, ...b.adopted],
  rejected: [...a.rejected, ...b.rejected],
});

const bisectUnits = async (
  units: ReadonlyArray<ReadonlyArray<Upgrade>>,
  probe: BisectUpgradesParams['probe'],
): Promise<BisectResult> => {
  if (units.length === 0) return EMPTY;
  const set = units.flat();
  if (await probe(set)) return { adopted: set, rejected: [] };
  if (units.length === 1) return { adopted: [], rejected: set };

  const middle = Math.ceil(units.length / 2);
  const left = await bisectUnits(units.slice(0, middle), probe);
  const right = await bisectUnits(units.slice(middle), probe);
  return merge(left, right);
};

// Tries the whole set first, then splits failing sets in half until each failure is pinned to one unit.
// A unit is one package, or a family released together (see groupUpgrades) that is never split.
// A clean run costs one probe; each breaking unit costs about log2(units) more.
// The left half runs before the right, so the right half is verified against whatever the left adopted.
export const bisectUpgrades = ({ candidates, probe }: BisectUpgradesParams): Promise<BisectResult> =>
  bisectUnits(groupUpgrades(candidates), probe);
