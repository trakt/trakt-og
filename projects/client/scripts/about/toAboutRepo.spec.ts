import { describe, expect, it } from 'vitest';
import type { GithubIssue } from './GithubIssue.ts';
import { toAboutRepo } from './toAboutRepo.ts';

const issue = (number: number, overrides: Partial<GithubIssue> = {}): GithubIssue => ({
  number,
  title: `Issue ${number}`,
  labels: [],
  created_at: `2026-10-${String(number).padStart(2, '0')}T00:00:00Z`,
  closed_at: null,
  ...overrides,
});

const build = (open: ReadonlyArray<GithubIssue>, closed: ReadonlyArray<GithubIssue> = []) =>
  toAboutRepo({
    stars: 42,
    open: { total: 9, items: open },
    closed: { total: 30, items: closed },
    commits: 6000,
    now: new Date('2026-10-22T08:00:00Z'),
  });

describe('util: toAboutRepo', () => {
  it('should keep the counts and stamp the time', () => {
    expect(build([])).toEqual({
      stars: 42,
      openIssues: 9,
      closedIssues: 30,
      commits: 6000,
      open: [],
      closed: [],
      updatedAt: '2026-10-22T08:00:00.000Z',
    });
  });

  it('should list the 7 newest open issues with their first label and when they were opened', () => {
    const open = [
      issue(20, { labels: [{ name: 'bug' }, { name: 'ui' }] }),
      ...[19, 18, 17, 16, 15, 14, 13].map((n) => issue(n)),
    ];
    const repo = build(open);
    expect(repo.open).toHaveLength(7);
    expect(repo.open.at(0)).toEqual({ number: 20, title: 'Issue 20', label: 'bug', at: '2026-10-20T00:00:00Z' });
    expect(repo.open.at(1)?.label).toBeNull();
  });

  it('should leave pull requests out', () => {
    expect(build([issue(3, { pull_request: {} }), issue(2)]).open.map(({ number }) => number)).toEqual([2]);
  });

  it('should list the 6 most recently closed issues by when they were closed', () => {
    const closed = [1, 2, 3, 4, 5, 6, 7].map((n) => issue(n, { closed_at: `2026-10-1${n}T00:00:00Z` }));
    const repo = build([], [...closed, issue(8, { closed_at: '2026-10-21T00:00:00Z', pull_request: {} })]);
    expect(repo.closed.map(({ number }) => number)).toEqual([7, 6, 5, 4, 3, 2]);
    expect(repo.closed.at(0)?.at).toBe('2026-10-17T00:00:00Z');
  });
});
