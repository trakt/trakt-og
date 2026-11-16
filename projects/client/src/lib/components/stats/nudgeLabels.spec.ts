import { describe, expect, it } from 'vitest';
import { nudgeLabels } from './nudgeLabels.ts';

const heights = (labels: ReturnType<typeof nudgeLabels>) => labels.map(({ id, at }) => [id, at]);

describe('util: nudgeLabels', () => {
  it('should leave labels that already clear each other', () => {
    expect(
      heights(
        nudgeLabels({
          labels: [
            { id: 'a', at: 70 },
            { id: 'b', at: 40 },
          ],
          gap: 8,
        }),
      ),
    ).toEqual([
      ['b', 40],
      ['a', 70],
    ]);
  });

  it('should push a close label up from the one under it', () => {
    expect(
      heights(
        nudgeLabels({
          labels: [
            { id: 'a', at: 50 },
            { id: 'b', at: 53 },
          ],
          gap: 8,
        }),
      ),
    ).toEqual([
      ['a', 50],
      ['b', 58],
    ]);
  });

  it('should pull labels back down instead of leaving the plot', () => {
    expect(
      heights(
        nudgeLabels({
          labels: [
            { id: 'a', at: 97 },
            { id: 'b', at: 99 },
            { id: 'c', at: 100 },
          ],
          gap: 8,
        }),
      ),
    ).toEqual([
      ['a', 84],
      ['b', 92],
      ['c', 100],
    ]);
  });
});
