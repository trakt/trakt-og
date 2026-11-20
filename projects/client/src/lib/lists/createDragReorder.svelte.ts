import { chipDropIndex } from '../components/header/chipDropIndex.ts';
import { previewReorder } from './previewReorder.ts';

type Key = string | number;
type Box = { readonly top: number; readonly bottom: number; readonly left: number; readonly right: number };

/** Where the dragged item's copy sits, in viewport pixels, and whether it's gliding into its place after a release. */
export type DragGhostState = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly settling: boolean;
};

type Held = {
  readonly key: Key;
  readonly from: number;
  readonly to: number;
  /** Every item's place on the page when the drag started. The places stay put; the items move through them. */
  readonly slots: readonly Box[];
};

type DragReorderOptions<T> = {
  items: () => readonly T[];
  key: (item: T) => Key;
  /** Matches each item's element inside the attached container, one per item, in order. */
  selector: string;
  canDrag: () => boolean;
  /** Saves a drop: the item takes the rank of the place it was dropped on. The preview holds until it settles. */
  drop: (item: T, rank: number) => unknown;
};

const SCROLL_EDGE = 100;
const SCROLL_STEP = 20;

const pageBox = (element: Element): Box => {
  const { top, bottom, left, right } = element.getBoundingClientRect();
  const { scrollX, scrollY } = globalThis;
  return { top: top + scrollY, bottom: bottom + scrollY, left: left + scrollX, right: right + scrollX };
};

/**
 * Drag to reorder with live reflow: the held item's copy follows the pointer while the other items make room for it,
 * so `items` always shows the order a drop would save. Escape or a cancelled pointer puts it back.
 * Listens on the window, since moving an item's element drops any pointer capture.
 */
export function createDragReorder<T extends { readonly rank: number }>(options: DragReorderOptions<T>) {
  let held = $state.raw<Held | null>(null);
  let lifted = $state.raw<(DragGhostState & { readonly key: Key }) | null>(null);
  let container: HTMLElement | null = null;
  let stop = () => {};

  // Placed by key, not by where it started: once a drop's save reorders the items, the preview has nothing to move.
  const items = $derived.by(() => {
    const all = options.items();
    if (!held) return all;
    const { key, to } = held;
    const from = all.findIndex((row) => options.key(row) === key);
    return from < 0 ? all : previewReorder(all, from, to);
  });
  const ghost = $derived.by(() => {
    if (!lifted) return null;
    const { key } = lifted;
    const item = items.find((row) => options.key(row) === key);
    return item ? { ...lifted, item } : null;
  });

  async function release(commit: boolean) {
    stop();
    const current = held;
    if (!current) return;
    const to = commit ? current.to : current.from;
    held = { ...current, to };
    const slot = current.slots.at(to);
    lifted =
      lifted && slot
        ? { ...lifted, x: slot.left - globalThis.scrollX, y: slot.top - globalThis.scrollY, settling: true }
        : null;
    const all = options.items();
    const item = all.at(current.from);
    const rank = all.at(to)?.rank;
    try {
      if (to !== current.from && item && rank !== undefined) await options.drop(item, rank);
    } finally {
      held = null;
    }
  }

  function start(item: T, event: PointerEvent) {
    const handle = event.currentTarget;
    if (held || lifted || event.button !== 0 || !options.canDrag() || !container) return;
    if (!(handle instanceof HTMLElement)) return;
    const all = options.items();
    const elements = [...container.querySelectorAll(options.selector)];
    const key = options.key(item);
    const from = all.findIndex((row) => options.key(row) === key);
    const element = elements.at(from);
    if (!element || elements.length !== all.length) return;

    event.preventDefault();
    handle.focus({ preventScroll: true });
    const box = element.getBoundingClientRect();
    const offsetX = event.clientX - box.left;
    const offsetY = event.clientY - box.top;
    const pointer = event.pointerId;
    held = { key, from, to: from, slots: elements.map(pageBox) };
    lifted = { key, x: box.left, y: box.top, width: box.width, settling: false };

    const over = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointer || !held || !lifted) return;
      const { clientX, clientY } = moveEvent;
      lifted = { ...lifted, x: clientX - offsetX, y: clientY - offsetY };
      if (clientY < SCROLL_EDGE) globalThis.scrollBy(0, -SCROLL_STEP);
      if (clientY > globalThis.innerHeight - SCROLL_EDGE) globalThis.scrollBy(0, SCROLL_STEP);
      const to = chipDropIndex({
        boxes: held.slots,
        from: held.to,
        x: clientX + globalThis.scrollX,
        y: clientY + globalThis.scrollY,
      });
      if (to !== null) held = { ...held, to };
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId === pointer) void release(upEvent.type === 'pointerup');
    };
    const escape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      void release(false);
    };
    globalThis.addEventListener('pointermove', over);
    globalThis.addEventListener('pointerup', up);
    globalThis.addEventListener('pointercancel', up);
    globalThis.addEventListener('keydown', escape);
    stop = () => {
      globalThis.removeEventListener('pointermove', over);
      globalThis.removeEventListener('pointerup', up);
      globalThis.removeEventListener('pointercancel', up);
      globalThis.removeEventListener('keydown', escape);
      stop = () => {};
    };
  }

  return {
    /** The items in the order to render: the drag's preview while one is held. */
    get items() {
      return items;
    },
    /** The dragged item's copy, with the rank it would land on, until it has settled. */
    get ghost() {
      return ghost;
    },
    /** The key of the item being dragged, whose place stays as a faded outline. */
    get dragging() {
      return lifted?.key ?? null;
    },
    /** The drag handle's pointerdown. */
    start,
    /** The ghost finished settling into its place. */
    landed: () => {
      lifted = null;
    },
    /** Attach to the element holding the items. */
    attach: (element: HTMLElement) => {
      container = element;
      return () => {
        stop();
        container = null;
        held = null;
        lifted = null;
      };
    },
  };
}
