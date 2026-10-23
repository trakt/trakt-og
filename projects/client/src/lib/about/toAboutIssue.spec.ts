import { describe, expect, it } from 'vitest';
import { toAboutIssue } from './toAboutIssue.ts';

const issue = { number: 109, title: 'Renew an expired token', label: 'bug', at: '2026-10-09T08:00:00Z' };

describe('toAboutIssue', () => {
  it('should link the issue and date it by its state', () => {
    expect(toAboutIssue(issue, 'open')).toEqual({
      number: 109,
      title: 'Renew an expired token',
      href: 'https://github.com/trakt/trakt-og/issues/109',
      tag: { text: 'Bug', kind: 'primary' },
      date: 'Opened Oct 9',
    });
    expect(toAboutIssue(issue, 'closed').date).toBe('Closed Oct 9');
  });

  it('should show features and polish in their own colors', () => {
    expect(toAboutIssue({ ...issue, label: 'enhancement' }, 'open').tag).toEqual({
      text: 'Feature',
      color: 'var(--brand-secondary)',
    });
    expect(toAboutIssue({ ...issue, label: 'polish' }, 'open').tag).toMatchObject({ text: 'Polish' });
  });

  it('should leave an unknown or missing label untagged', () => {
    expect(toAboutIssue({ ...issue, label: 'question' }, 'open').tag).toBeNull();
    expect(toAboutIssue({ ...issue, label: null }, 'open').tag).toBeNull();
  });
});
