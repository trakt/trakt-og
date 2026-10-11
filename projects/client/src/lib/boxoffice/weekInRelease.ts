const DAY = 86_400_000;

/** How long a film has been out on a box office weekend: its opening, its week, or a re-release of an older film. */
export type WeekInRelease =
  | { readonly kind: 'opening'; readonly label: 'Opening' }
  | { readonly kind: 'week'; readonly label: string }
  | { readonly kind: 're-release'; readonly label: string };

/**
 * Where a film stands on the weekend starting `friday`, from its U.S. release date (both `YYYY-MM-DD`). A Wednesday or
 * Thursday release still opens that weekend; anything out for over a year is back in theaters as a re-release.
 */
export function weekInRelease(released: string | null | undefined, friday: string): WeekInRelease | null {
  if (!released) return null;
  const days = Math.round((Date.parse(friday) - Date.parse(released.slice(0, 10))) / DAY);
  if (days <= 3) return { kind: 'opening', label: 'Opening' };
  if (days > 365) return { kind: 're-release', label: `Re-release · ${released.slice(0, 4)}` };
  return { kind: 'week', label: `Week ${Math.floor((days + 3) / 7) + 1}` };
}
