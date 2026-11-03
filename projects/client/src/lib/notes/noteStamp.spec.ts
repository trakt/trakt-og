import { describe, expect, it } from 'vitest';
import { noteStamp } from './noteStamp.ts';

describe('noteStamp', () => {
  it('should show when a note was added until it is edited', () => {
    expect(noteStamp({ createdAt: '2026-09-07T10:00:00.000Z', updatedAt: '2026-09-07T10:00:00.400Z' })).toEqual({
      label: 'Added',
      at: '2026-09-07T10:00:00.000Z',
    });
  });

  it('should show when an edited note was updated', () => {
    expect(noteStamp({ createdAt: '2026-09-07T10:00:00.000Z', updatedAt: '2026-09-09T08:00:00.000Z' })).toEqual({
      label: 'Updated',
      at: '2026-09-09T08:00:00.000Z',
    });
  });

  it('should fall back to whichever date the API sent', () => {
    expect(noteStamp({ createdAt: null, updatedAt: '2026-09-09T08:00:00.000Z' })).toEqual({
      label: 'Updated',
      at: '2026-09-09T08:00:00.000Z',
    });
    expect(noteStamp({ createdAt: '2026-09-07T10:00:00.000Z', updatedAt: null })).toEqual({
      label: 'Added',
      at: '2026-09-07T10:00:00.000Z',
    });
    expect(noteStamp({ createdAt: null, updatedAt: null })).toBeNull();
  });
});
