import { describe, expect, it } from 'vitest';
import { pickHelpScene } from './pickHelpScene.ts';

describe('pickHelpScene', () => {
  it('should pick each scene across the random range', () => {
    expect(pickHelpScene(() => 0)).toBe('sonar');
    expect(pickHelpScene(() => 0.5)).toBe('houston');
    expect(pickHelpScene(() => 0.999)).toBe('encounters');
  });
});
