/** A row icon. Left without `onclick`, it renders as OG's icon but is marked unavailable until its issue wires it. */
type ListRowAction = { readonly onclick?: () => void; readonly warning?: string; readonly busy?: boolean };

/**
 * The icons on the right of a list row's header bar, by viewer. Each one that's
 * set shows. The calendar subscribe icon is cut.
 */
export interface ListRowActions {
  /** The report flag, for signed-in viewers. It fades in while the pointer is over the row. */
  readonly report?: ListRowAction;
  /** The owner's pencil. */
  readonly edit?: ListRowAction;
  /** The owner's delete icon, on personal lists only. `question` asks something other than "Delete this list?". */
  readonly delete?: ListRowAction & { readonly question?: string };
  /** "Stop collaborating on this list", for a collaborator. */
  readonly leave?: ListRowAction;
  /** Where "View watched progress" goes. Left out on official lists. */
  readonly progressHref?: string;
  /** A smart list's chart, with its filters on: an "Open on Popular" pill beside the item count. */
  readonly chart?: { readonly href: string; readonly label: string };
  /** The absolute URL the share icon shares. */
  readonly shareUrl?: string;
}
