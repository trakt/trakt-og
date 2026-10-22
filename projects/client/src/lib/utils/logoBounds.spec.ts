import { describe, expect, it } from 'vitest';
import { logoBounds } from './logoBounds.ts';

// A width × height image, transparent except the pixels given as [x, y, alpha].
function image(width: number, height: number, pixels: [number, number, number][]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y, alpha] of pixels) data[(y * width + x) * 4 + 3] = alpha;
  return { data, width, height };
}

describe('logoBounds', () => {
  it('should box the drawn pixels', () => {
    expect(logoBounds(image(10, 6, [[2, 1, 255], [7, 4, 255]]))).toEqual({ x: 2, y: 1, width: 6, height: 4 });
  });

  it('should keep a logo that fills its image', () => {
    expect(logoBounds(image(3, 2, [[0, 0, 255], [2, 1, 255]]))).toEqual({ x: 0, y: 0, width: 3, height: 2 });
  });

  it('should ignore faint pixels under the threshold', () => {
    expect(logoBounds(image(10, 6, [[0, 0, 5], [4, 3, 200]]))).toEqual({ x: 4, y: 3, width: 1, height: 1 });
  });

  it('should find nothing in a transparent image', () => {
    expect(logoBounds(image(4, 4, []))).toBeUndefined();
  });
});
