import type { boxExtraLoader } from './boxExtraLoader.ts';
import type { BoxInput } from './BoxInput.ts';
import { pickProfileBoxes } from './pickProfileBoxes.ts';
import { profileBoxes } from './profileBoxes.ts';

/** Scores every registered box once and keeps the four the strip shows, each with its view. */
export async function toProfileBoxes(input: BoxInput, extras: ReturnType<typeof boxExtraLoader>) {
  return pickProfileBoxes(await Promise.all(profileBoxes.map((box) => box.evaluate(input, extras))));
}
