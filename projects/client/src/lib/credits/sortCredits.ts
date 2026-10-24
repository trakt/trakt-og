import type { CreditPerson } from './toCredits.ts';

export type CreditSort = 'billing' | 'name' | 'role' | 'episodes';

const collator = new Intl.Collator('en-US', { sensitivity: 'base' });
const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

/**
 * The last word that isn't a suffix: "Walter White Jr." is "White". Several characters ("Gus' Messenger, Victor") use
 * the first.
 */
function lastName(text: string): string {
  const first = text.split(', ')[0] ?? '';
  const words = first.split(/\s+/).filter(Boolean);
  return words.findLast((word) => !SUFFIXES.has(word.toLowerCase().replace(/[.,]/g, ''))) ?? first;
}

/**
 * The cast & crew page's sort. Billing keeps the API's order; names run A to Z by last name, then the whole name;
 * roles A to Z by the first character's last name alone (ties stay in billing order), or by the whole job for crew,
 * people without a role last; episodes run most first. `flipped` reverses each.
 */
export function sortCredits(
  people: readonly CreditPerson[],
  { by, flipped, characters }: { by: CreditSort; flipped: boolean; characters: boolean },
): readonly CreditPerson[] {
  const role = (person: CreditPerson) => (characters ? lastName(person.role) : person.role);
  const sorted =
    by === 'billing'
      ? [...people]
      : people.toSorted((a, b) => {
          if (by === 'name')
            return collator.compare(lastName(a.name), lastName(b.name)) || collator.compare(a.name, b.name);
          if (by === 'role') return (a.role ? 0 : 1) - (b.role ? 0 : 1) || collator.compare(role(a), role(b));
          return (b.episodeCount ?? 0) - (a.episodeCount ?? 0);
        });
  return flipped ? sorted.toReversed() : sorted;
}
