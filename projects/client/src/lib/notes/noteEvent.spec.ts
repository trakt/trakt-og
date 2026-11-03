import { describe, expect, it } from 'vitest';
import { AnalyticsEvent } from '$lib/analytics/AnalyticsEvent';
import { noteEvent } from './noteEvent.ts';

describe('noteEvent', () => {
  it('should add a note when there was none', () => {
    expect(noteEvent(false, 'Great ending')).toBe(AnalyticsEvent.AddNote);
  });

  it('should edit a note that existed', () => {
    expect(noteEvent(true, 'Great ending')).toBe(AnalyticsEvent.EditNote);
  });

  it('should delete a note cleared to blank', () => {
    expect(noteEvent(true, '   ')).toBe(AnalyticsEvent.DeleteNote);
  });

  it('should track nothing for blank text with no note', () => {
    expect(noteEvent(false, '')).toBeNull();
  });
});
