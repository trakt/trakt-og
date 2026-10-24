import { seasonName } from '../utils/seasonName.ts';
/** The previous and next season arrows on a season page and its subpages, when those seasons exist. */
export function seasonNeighbours({
  showHref,
  number,
  seasons,
}: {
  showHref: string;
  number: number;
  seasons: readonly { readonly number: number }[];
}) {
  const link = (target: number, direction: string) =>
    seasons.some((item) => item.number === target)
      ? {
          href: `${showHref}/seasons/${target}`,
          label: `${direction}: ${seasonName(target)}`,
        }
      : undefined;
  return { previous: link(number - 1, 'Previous'), next: link(number + 1, 'Next') };
}
