type Box = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;

type ChipDropIndexParams = {
  /** Every chip's box, in order. */
  boxes: readonly Box[];
  /** The dragged chip's index. */
  from: number;
  x: number;
  y: number;
};

const contains = (box: Box, x: number, y: number) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

/**
 * Where a dragged chip goes: the index of the chip under the pointer, once the pointer passes that chip's middle
 * in the direction it's moving. Without the middle, a narrow chip dragged over a wide one would swap back and forth,
 * since the wide one lands under the pointer again. A chip on another row (the bar wraps while editing) takes it at
 * once. Null when it stays put.
 */
export function chipDropIndex({ boxes, from, x, y }: ChipDropIndexParams): number | null {
  const own = boxes.at(from);
  if (!own) return null;

  const to = boxes.findIndex((box, index) => {
    if (index === from || !contains(box, x, y)) return false;
    if (box.top !== own.top) return true;
    const middle = (box.left + box.right) / 2;
    return index > from ? x > middle : x < middle;
  });
  return to === -1 ? null : to;
}
