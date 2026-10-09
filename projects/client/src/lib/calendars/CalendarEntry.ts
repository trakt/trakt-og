import type { QuickIconFill } from '../components/media/quickIconFill.ts';
import type { OverlayState } from '../overlay/createOverlay.svelte.ts';
import type { CalendarCard } from './toCalendarCard.ts';
import type { CalendarGroupCard } from './toCalendarGroupCard.ts';

/** A card on the calendar with the viewer's state: one entry, or a show's episodes from one day. */
export type CalendarEntry = (CalendarCard | CalendarGroupCard) & {
  readonly state: OverlayState;
  readonly fill: QuickIconFill;
  readonly faded: boolean;
};
