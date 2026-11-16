import { describe, expect, it } from 'vitest';
import { qualityScale } from './qualityScale.ts';

describe('util: qualityScale', () => {
  it('should run 0 to 100 in quarters by default', () => {
    const scale = qualityScale({ values: [59, 80], zoom: false });
    expect(scale.low).toBe(0);
    expect(scale.levels).toEqual([0, 25, 50, 75, 100]);
  });

  it('should zoom to the nearest 10 under the lowest value, with a level every 10', () => {
    const scale = qualityScale({ values: [59, 80], zoom: true });
    expect(scale.low).toBe(50);
    expect(scale.levels).toEqual([50, 60, 70, 80, 90, 100]);
  });

  it('should leave headroom when the lowest value sits on a level', () => {
    expect(qualityScale({ values: [60, 80], zoom: true }).low).toBe(50);
  });

  it('should never zoom above 90, or below 0', () => {
    expect(qualityScale({ values: [99], zoom: true }).levels).toEqual([90, 100]);
    expect(qualityScale({ values: [4], zoom: true }).low).toBe(0);
  });

  it('should stay full with nothing to zoom to', () => {
    expect(qualityScale({ values: [], zoom: true }).low).toBe(0);
  });

  it('should place values as a percent of the plot height', () => {
    expect(qualityScale({ values: [59], zoom: false }).at(50)).toBe(50);
    expect(qualityScale({ values: [59], zoom: true }).at(75)).toBe(50);
  });
});
