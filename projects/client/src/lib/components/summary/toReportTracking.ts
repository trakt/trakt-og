import type { ReportTarget } from './ReportTarget.ts';

const COMMENT = ['spoilers', 'abusive', 'spam', 'bigotry', 'political', 'offtopic', 'duplicate', 'other'];
const MEDIA = [
  'duplicate',
  'remove',
  'data_refresh',
  'metadata',
  'adult',
  'runtime',
  'language',
  'spam',
  'tmdb',
  'other',
];
const PERSON = ['duplicate', 'remove', 'data_refresh', 'metadata', 'adult', 'language', 'spam', 'tmdb', 'other'];
const LIST = ['duplicate', 'remove', 'metadata', 'adult', 'language', 'spam', 'other'];
const USER = ['spam', 'adult', 'language', 'other'];

// trakt-web's `reasonsFor`: a reason outside the type's own list reports as `other`.
const REASONS: Readonly<Record<string, ReadonlyArray<string>>> = {
  comment: COMMENT,
  movie: MEDIA,
  show: MEDIA,
  season: MEDIA,
  episode: MEDIA,
  person: PERSON,
  list: LIST,
  user: USER,
};

type ReportResult = { readonly ok: boolean; readonly status?: number };

const toOutcome = ({ ok, status }: ReportResult) => {
  if (ok) return 'sent';
  if (status === 409) return 'already-reported';
  if (status === 429) return 'rate-limited';
  return 'unknown';
};

/** trakt-web's `action.report` payload for a report's result. */
export function toReportTracking({
  type,
  reason,
  result,
}: {
  type: ReportTarget['type'];
  reason: string;
  result: ReportResult;
}) {
  return {
    type,
    reason: REASONS[type]?.includes(reason) ? reason : 'other',
    outcome: toOutcome(result),
  } as const;
}
