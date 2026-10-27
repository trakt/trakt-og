import type { ListRowActions } from '../../components/media/ListRowActions.ts';
import type { UserListRow } from './UserListRow.ts';

type ListRowActionsParams = {
  row: UserListRow;
  /** The signed-in viewer, or null. */
  viewer: { readonly slug: string } | null;
  /** The viewer is an approved collaborator on the list. */
  isCollaborator: boolean;
  /** og's origin, for the share URL. */
  origin: string;
};

/**
 * Which icons a list row shows the viewer: the report flag and progress (not on official lists) when signed in, the
 * owner's edit and (personal lists only) delete, a collaborator's "Stop collaborating", and share. The lists page
 * wires the clicks: edit opens the list editor, or the watchlist or favorites editor on theirs. The watchlist and
 * favorites resolve their numeric list id from their comments on click.
 */
export function listRowActions({ row, viewer, isCollaborator, origin }: ListRowActionsParams): ListRowActions {
  const owner = viewer?.slug === row.owner.slug;

  return {
    ...(viewer && { report: {} }),
    ...(owner && row.kind !== 'official' && { edit: {} }),
    ...(owner && row.kind === 'personal' && { delete: {} }),
    ...(!owner && isCollaborator && { leave: {} }),
    ...(viewer && row.kind !== 'official' && progressAction(row, viewer.slug)),
    shareUrl: `${origin}${row.href}`,
  };
}

/** A row with its list id links to progress; the watchlist and favorites resolve theirs on click. */
function progressAction(row: UserListRow, slug: string) {
  return row.id === null ? { progress: {} } : { progressHref: `/users/${slug}/progress?list=${row.id}` };
}
