import { describe, expect, it } from 'vitest';
import { parseIconSvg } from './parseIconSvg.ts';
import { pieSvg } from './pieSvg.ts';

const OUTLINE = 'M256 0A256 256 0 1 1 256 512A256 256 0 1 1 256 0Z';
const path = (share: number) => parseIconSvg(pieSvg(share)).pathData;

describe('pieSvg', () => {
  it('should be an icon SVG Icon can read', () => {
    expect(parseIconSvg(pieSvg(0.5)).viewBox).toBe('0 0 512 512');
  });

  it('should draw only the ring with nothing watched', () => {
    expect(path(0)).toBe(`${OUTLINE}M256 48A208 208 0 1 0 256 464A208 208 0 1 0 256 48Z`);
  });

  it('should fill the whole circle when everything is watched', () => {
    expect(path(1)).toBe(OUTLINE);
  });

  it("should cut the unwatched wedge from 12 o'clock back to the share", () => {
    expect(path(0.25)).toBe(`${OUTLINE}M256 256L256 48A208 208 0 1 0 464 256Z`);
    expect(path(0.75)).toBe(`${OUTLINE}M256 256L256 48A208 208 0 0 0 48 256Z`);
  });

  it('should floor to whole percents, so only a full share closes the circle', () => {
    expect(pieSvg(31 / 39)).toBe(pieSvg(0.79));
    expect(pieSvg(0.29)).not.toBe(pieSvg(0.28));
    expect(pieSvg(0.996)).not.toBe(pieSvg(1));
  });

  it('should clamp shares outside 0 to 1, and treat a bad share as none', () => {
    expect(pieSvg(1.4)).toBe(pieSvg(1));
    expect(pieSvg(-0.2)).toBe(pieSvg(0));
    expect(pieSvg(Number.NaN)).toBe(pieSvg(0));
  });
});
