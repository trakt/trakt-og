import { describe, expect, it } from 'vitest';
import { aboutRecords } from './aboutRecords.ts';
import type { AboutWeek } from './AboutWeek.ts';

const week: AboutWeek = {
  week: '2026-10-19',
  from: '2026-10-19',
  to: '2026-10-25',
  counts: { new: 1, fixed: 0, faster: 0 },
  sections: [{ name: 'Profiles', count: 1 }],
  authors: [{ login: 'alice', avatar: 'https://avatars.githubusercontent.com/u/1' }],
  commits: [{ sha: 'aaaaaaa', type: 'feat', scope: 'users', subject: 'x', author: 'alice' }],
  summary: null,
  lastCommit: 'aaaaaaa',
  updatedAt: '2026-10-22T08:00:00.000Z',
  final: false,
};

const repo = {
  stars: 1,
  openIssues: 2,
  closedIssues: 3,
  commits: 4,
  open: [],
  closed: [],
  updatedAt: '2026-10-22T08:00:00.000Z',
};

describe('util: aboutRecords', () => {
  it('should key weeks by Monday and write them before the index and repo', () => {
    expect(aboutRecords({ weeks: [week], index: ['2026-10-19'], repo }).map(({ key }) => key)).toEqual([
      'week:2026-10-19',
      'weeks',
      'repo',
    ]);
  });

  it('should leave out the parts that are missing', () => {
    expect(aboutRecords({ weeks: [], index: null, repo: null })).toEqual([]);
  });

  it('should refuse a record that does not match its shape', () => {
    const bad = { ...week, authors: [{ login: 'alice', avatar: 'not a url' }] };
    expect(() => aboutRecords({ weeks: [bad], index: null, repo: null })).toThrow();
    expect(() => aboutRecords({ weeks: [], index: ['Oct 19'], repo: null })).toThrow();
  });
});
