import type { CreditPerson } from './toCredits.ts';

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** The cast & crew page's filter: the name or the role contains the terms, ignoring case and accents. */
export function matchesCreditTerms(person: Pick<CreditPerson, 'name' | 'role'>, terms: string): boolean {
  const needle = fold(terms.trim());
  if (!needle) return true;
  return fold(person.name).includes(needle) || fold(person.role).includes(needle);
}
