import type { ReportTarget } from './ReportTarget.ts';

/** The report message's placeholder: what the team needs for the picked reason. */
export function reportPlaceholder(type: ReportTarget['type'], reason: string): string {
  if (reason === 'duplicate' && type === 'comment') return 'Paste Trakt links to the original and each duplicate';
  if (reason === 'duplicate') return 'Paste the Trakt link to the correct item';
  if (reason === 'metadata') return "What's wrong, and when did you fix it on TMDB?";
  if (reason === 'runtime') return 'The correct runtime, and where it comes from';
  if (reason === 'spoilers') return 'Which part is the spoiler?';
  return 'Add details for the Trakt team';
}
