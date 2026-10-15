/** The subpages a season has. A show has every one, lists included. */
const SEASON_SUBPAGES: ReadonlySet<string> = new Set(['comments', 'credits', 'stats']);

type Parent = { readonly title: string; readonly href?: string };

type Params = {
  /** The subpage's item: a season's parent is its show, an episode's its show and season. */
  type: string;
  parents: readonly Parent[];
  /** "comments", "credits", "lists", "stats". */
  suffix: string;
};

/**
 * On a subpage, the tag bar's show and season (by number and by its own title) stay on the same subpage, for that
 * show or season: an episode's comments step up to the season's comments. A season has no lists page, so there it steps up to the season itself. A movie's
 * collection is an official list, not a show, so it keeps its own link.
 */
export function subpageParents({ type, parents, suffix }: Params): readonly Parent[] {
  if (type !== 'season' && type !== 'episode') return parents;
  return parents.map((parent, i) => {
    const isSeason = type === 'episode' && i > 0;
    if (!parent.href || (isSeason && !SEASON_SUBPAGES.has(suffix))) return parent;
    return { ...parent, href: `${parent.href}/${suffix}` };
  });
}
