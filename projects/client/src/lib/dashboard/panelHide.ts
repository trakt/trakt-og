import { listFilterOptions } from '../lists/listFilterOptions.ts';
import { listCardHidden, listHideReady, unavailableHides } from '../lists/listHide.ts';
import type { ListItemCard } from '../lists/toListItemCard.ts';
import { overlay } from '../overlay/overlay.ts';
import type { ListPanel } from './toListPanel.ts';

const NOTES = ['notes', 'nonotes'];

/** A list panel's Hide options: the list page's, less the notes on a smart list, which has none. */
export function panelHideOptions({ kind, isSelf }: { kind: string; isSelf: boolean }) {
  const { hide } = listFilterOptions({ kind, types: [], isSelf });
  return kind === 'smart' ? hide.filter(({ id }) => !NOTES.includes(id)) : hide;
}

/** Why a panel's Hide toggle is off: a list too long to read whole, or the viewer data it reads failed to load. */
export function panelHideDisabled(panel: Pick<ListPanel, 'scope'>): (id: string) => string | undefined {
  if (panel.scope === 'tooLong') return () => 'This is too large to use this filter';
  const unavailable = unavailableHides({ slices: overlay.slices(), failed: overlay.failed() });
  return (id) => unavailable.get(id);
}

/**
 * The cards a panel shows under its hides, which apply once it has read the whole list and the viewer's data they read
 * has loaded: null until then. A hide whose data failed to load stays off.
 */
export function panelCards(panel: ListPanel, hide: readonly string[]): readonly ListItemCard[] | null {
  const disabled = panelHideDisabled(panel);
  const on = panel.scope === 'whole' ? hide.filter((option) => !disabled(option)) : [];
  if (on.length === 0) return panel.cards;
  if (!listHideReady({ hide: on, slices: overlay.slices(), signedIn: true })) return null;
  const now = new Date();
  return panel.cards.filter(
    (card) =>
      !listCardHidden({
        card,
        hide: on,
        state: card.type === 'person' ? {} : overlay.state(card.type, card.id, card.seasonOf),
        signedIn: true,
        now,
      }),
  );
}
