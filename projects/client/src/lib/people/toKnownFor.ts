import { creditFame } from './creditFame.ts';
import type { KnownForItem } from './knownForSchema.ts';
import { matchesCreditFilter } from './matchesCreditFilter.ts';
import type { PersonCredit } from './PersonCredit.ts';

type ToKnownForParams = {
  items: readonly KnownForItem[];
  /** The person's credits by department; a title's acting credit wins, since it names the character. */
  departments: readonly { readonly id: string; readonly credits: readonly PersonCredit[] }[];
  /** The person's known-for department: its picks lead, so an actor's row isn't led by episodes they directed. */
  department?: string;
  limit: number;
};

const key = (type: string, id: number) => `${type}-${id}`;

/**
 * The Known For row: the API's picks as the person's own credits, without appearances as themselves. Picks from the
 * person's own department lead, then the rest, each best known first (`creditFame`, so a long-running show holds its
 * place beside more voted films). The API's order favors recent titles, so it isn't kept.
 */
export function toKnownFor({ items, departments, department, limit }: ToKnownForParams): PersonCredit[] {
  const own = new Set(
    departments.find(({ id }) => id === department)?.credits.map((credit) => key(credit.type, credit.id)) ?? [],
  );
  const ordered = departments.toSorted((a, b) => Number(b.id === 'acting') - Number(a.id === 'acting'));
  const credits = new Map(
    ordered.flatMap(({ credits }) => credits).toReversed().map((credit) => [key(credit.type, credit.id), credit]),
  );
  const picks = new Set(items.flatMap(({ type, movie, show }) => {
    const id = (type === 'movie' ? movie : show)?.ids.trakt;
    return id === undefined ? [] : [key(type, id)];
  }));

  return [...picks]
    .flatMap((pick) => credits.get(pick) ?? [])
    .filter((credit) => !matchesCreditFilter({ option: 'self', credit, state: {} }))
    .toSorted((a, b) =>
      Number(own.has(key(b.type, b.id))) - Number(own.has(key(a.type, a.id))) || creditFame(b) - creditFame(a)
    )
    .slice(0, limit);
}
