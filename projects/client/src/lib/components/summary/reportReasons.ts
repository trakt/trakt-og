import type { ReportTarget } from './ReportTarget.ts';

const userReasons = [
  { value: 'adult', label: 'Adult' },
  { value: 'language', label: 'Not English' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const;

// in OG's order.
const commentReasons = [
  { value: 'spoilers', label: 'Spoilers' },
  { value: 'language', label: 'Not English' },
  { value: 'abusive', label: 'Abusive' },
  { value: 'spam', label: 'Spam' },
  { value: 'bigotry', label: 'Bigotry' },
  { value: 'political', label: 'Political Attack' },
  { value: 'offtopic', label: 'Off Topic' },
  { value: 'support', label: 'Support Question' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'too_short', label: 'Too Short' },
  { value: 'other', label: 'Other' },
] as const;

/** Members get fewer reasons than comments do. */
export function reportReasons(type: ReportTarget['type']): ReadonlyArray<{ value: string; label: string }> {
  return type === 'comment' ? commentReasons : userReasons;
}
