import type { TagPill } from '../components/labels/TagPill.ts';
import type { AboutIssueRow } from './AboutIssueRow.ts';
import { ogRepoUrls } from './ogRepoUrls.ts';

const LABEL_TAGS: Readonly<Record<string, TagPill>> = {
  bug: { text: 'Bug', kind: 'primary' },
  enhancement: { text: 'Feature', color: 'var(--brand-secondary)' },
  polish: { text: 'Polish', color: 'var(--brand-seventh)' },
};

export type AboutIssue = {
  readonly number: number;
  readonly title: string;
  readonly href: string;
  readonly tag: TagPill | null;
  readonly date: string;
};

/** An open or closed issue as the sidebar lists it, its GitHub label as one of og's tags. */
export function toAboutIssue(issue: AboutIssueRow, state: 'open' | 'closed'): AboutIssue {
  const day = new Date(issue.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return {
    number: issue.number,
    title: issue.title,
    href: ogRepoUrls.issue(issue.number),
    tag: issue.label ? (LABEL_TAGS[issue.label] ?? null) : null,
    date: `${state === 'open' ? 'Opened' : 'Closed'} ${day}`,
  };
}
