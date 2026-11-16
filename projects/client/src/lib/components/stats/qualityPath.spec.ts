import { describe, expect, it } from 'vitest';
import { qualityPath } from './qualityPath.ts';

const at = (value: number) => value;

describe('util: qualityPath', () => {
  it('should join the points at their column middles', () => {
    expect(qualityPath({ values: [80, 60], at })).toBe('M25 20L75 40');
  });

  it('should break the line at a null', () => {
    expect(qualityPath({ values: [80, 60, null, 50, 40], at })).toBe('M10 20L30 40M70 50L90 60');
  });

  it('should draw no line for a point on its own', () => {
    expect(qualityPath({ values: [80, null, 60], at })).toBe('');
  });

  it('should close each run down to the floor for an area', () => {
    expect(qualityPath({ values: [80, 60, null, 50, 40], at, area: true })).toBe(
      'M10 100L10 20L30 40L30 100ZM70 100L70 50L90 60L90 100Z',
    );
  });
});
