import type { ListRowActions } from '../../components/media/ListRowActions.ts';
import { listProgressHref } from '../../lists/listProgressHref.ts';
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
 * wires the clicks: edit opens the list editor, or the watchlist or favorites editor on theirs.
 */
export function listRowActions({ row, viewer, isCollaborator, origin }: ListRowActionsParams): ListRowActions {
  const owner = viewer?.slug === row.owner.slug;
  const progressHref = viewer
    ? listProgressHref({ list: { ...row, ownerSlug: row.owner.slug }, viewerSlug: viewer.slug })
    : undefined;

  return {
    ...(viewer && { report: {} }),
    ...(owner && row.kind !== 'official' && { edit: {} }),
    ...(owner && row.kind === 'personal' && { delete: {} }),
    ...(!owner && isCollaborator && { leave: {} }),
    ...(progressHref && { progressHref }),
    shareUrl: `${origin}${row.href}`,
  };
}
