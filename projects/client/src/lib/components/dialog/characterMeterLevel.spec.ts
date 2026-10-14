import { describe, expect, it } from 'vitest';
import { characterMeterLevel } from './characterMeterLevel.ts';

describe('util: characterMeterLevel', () => {
  it('should be ok with plenty left', () => {
    expect(characterMeterLevel(500)).toBe('ok');
    expect(characterMeterLevel(100)).toBe('ok');
  });

  it('should warn under 100 left', () => {
    expect(characterMeterLevel(99)).toBe('warn');
    expect(characterMeterLevel(25)).toBe('warn');
  });

  it('should be full under 25 left', () => {
    expect(characterMeterLevel(24)).toBe('full');
    expect(characterMeterLevel(0)).toBe('full');
  });
});
