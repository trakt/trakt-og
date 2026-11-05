import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';

/** Web's note events: text on a new note adds it, text on an existing one edits it, and blank text deletes it. */
export function noteEvent(existed: boolean, text: string) {
  if (text.trim()) return existed ? AnalyticsEvent.EditNote : AnalyticsEvent.AddNote;
  return existed ? AnalyticsEvent.DeleteNote : null;
}
