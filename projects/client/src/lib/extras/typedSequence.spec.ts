import { describe, expect, it } from 'vitest';
import { SEQUENCE_GAP_MS, typedSequence } from './typedSequence.ts';

const start = { keys: '', at: 0 };

describe('util: typedSequence', () => {
  it('should collect keys that belong to the target', () => {
    const one = typedSequence(start, '1', 100, '12');
    expect(typedSequence(one, '2', 200, '12').keys).toBe('12');
  });

  it('should start over on a key outside the target', () => {
    const one = typedSequence(start, '1', 100, '12');
    expect(typedSequence(one, 'x', 200, '12').keys).toBe('');
  });

  it('should start over after a long pause', () => {
    const one = typedSequence(start, '1', 100, '12');
    expect(typedSequence(one, '2', 101 + SEQUENCE_GAP_MS, '12').keys).toBe('2');
  });

  it('should keep only the last keys as long as the target', () => {
    const one = typedSequence(start, '1', 100, '11');
    const two = typedSequence(one, '1', 200, '11');
    expect(typedSequence(two, '1', 300, '11').keys).toBe('11');
  });

  it('should ignore named keys like Shift', () => {
    expect(typedSequence({ keys: '1', at: 100 }, 'Shift', 200, '12').keys).toBe('');
  });
});
