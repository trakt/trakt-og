import type { ListRowActions } from '../../components/media/ListRowActions.ts';
import { pinFor } from '../../dashboard/listPins.ts';
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
 * Which icons a list row shows the viewer: progress (its franchises when it's movies only) when signed in, the
 * owner's edit and (personal lists only) delete, a collaborator's "Stop collaborating", and share. The lists page
 * wires the clicks: edit opens the list editor, or the watchlist or favorites editor on theirs. A smart list is only
 * edited, deleted and shared: its progress has no page.
 */
export function listRowActions({ row, viewer, isCollaborator, origin }: ListRowActionsParams): ListRowActions {
  const owner = viewer?.slug === row.owner.slug;
  const { kind } = row;
  const id = kind === 'smart' ? (row.smart?.slug ?? '') : (row.id ?? '');
  const list =
    viewer && pinFor({ list: { ...row, id, ownerSlug: row.owner.slug }, viewer: viewer.slug, owner: row.owner });
  const pin = viewer && list && { pin: { viewer: viewer.slug, list } };
  if (kind === 'smart') {
    return { ...(owner && { edit: {}, delete: {} }), shareUrl: `${origin}${row.href}`, ...pin };
  }
  const progressHref = viewer
    ? listProgressHref({ list: { ...row, kind, ownerSlug: row.owner.slug }, viewerSlug: viewer.slug })
    : undefined;

  return {
    ...(owner && row.kind !== 'official' && { edit: {} }),
    ...(owner && row.kind === 'personal' && { delete: {} }),
    ...(!owner && isCollaborator && { leave: {} }),
    ...(progressHref && { progressHref }),
    shareUrl: `${origin}${row.href}`,
    ...pin,
  };
}
