import { describe, expect, it, vi } from 'vitest';
import type { AboutWeek } from './AboutWeek.ts';
import { buildAboutWeeks } from './buildAboutWeeks.ts';
import type { CountedCommit } from './CountedCommit.ts';
import type { Summarize } from './Summarize.ts';

const now = new Date('2026-10-22T12:00:00Z');

const commit = (sha: string, week: string, subject = `subject ${sha}`): CountedCommit => ({
  sha: `${sha}000000000`,
  email: 'a@example.com',
  week,
  type: 'feat',
  scope: 'users',
  subject,
});

const commits = [
  commit('3333333', '2026-10-19'),
  commit('2222222', '2026-10-12'),
  commit('1111111', '2026-09-28'),
];

const authors = new Map([['a@example.com', { login: 'alice', avatar: 'https://avatars.githubusercontent.com/u/1' }]]);

const draft = {
  title: 'The One With Profiles',
  themes: [{ section: 'Profiles' as const, text: 'Profiles show more.' }],
};

const none = () => Promise.resolve(null);

describe('util: buildAboutWeeks', () => {
  it('should backfill every week with commits and skip empty weeks', async () => {
    const summarize = vi.fn<Summarize>(() => Promise.resolve(draft));
    const { weeks, index } = await buildAboutWeeks({ commits, authors, stored: none, summarize, now });

    expect(index).toEqual(['2026-10-19', '2026-10-12', '2026-09-28']);
    expect(weeks.map(({ week, final }) => [week, final])).toEqual([
      ['2026-10-19', false],
      ['2026-10-12', true],
      ['2026-09-28', true],
    ]);
    expect(summarize).toHaveBeenCalledTimes(3);
    expect(summarize).toHaveBeenCalledWith({
      week: '2026-10-12',
      from: '2026-10-12',
      to: '2026-10-18',
      subjects: ['feat(users): subject 2222222'],
    });
  });

  it('should stamp a new summary with the commit it covers and the time', async () => {
    const { weeks } = await buildAboutWeeks({
      commits,
      authors,
      stored: none,
      summarize: () => Promise.resolve(draft),
      now,
    });
    expect(weeks.at(0)?.summary).toEqual({ ...draft, through: '3333333', at: '2026-10-22T12:00:00.000Z' });
  });

  it('should leave final weeks alone and keep a summary when the new one fails', async () => {
    const previous = (week: string, final: boolean): AboutWeek => ({
      week,
      from: week,
      to: week,
      counts: { new: 0, fixed: 0, faster: 0 },
      sections: [],
      authors: [],
      commits: [],
      summary: { ...draft, through: 'old0000', at: '2026-10-20T00:00:00Z' },
      lastCommit: 'old0000',
      updatedAt: '2026-10-20T00:00:00Z',
      final,
    });
    const stored = (week: string) => Promise.resolve(previous(week, week !== '2026-10-19'));
    const summarize = vi.fn<Summarize>(() => Promise.reject(new Error('model down')));

    const { weeks, index } = await buildAboutWeeks({ commits, authors, stored, summarize, now });

    expect(index).toHaveLength(3);
    expect(weeks.map(({ week }) => week)).toEqual(['2026-10-19']);
    expect(weeks.at(0)?.summary?.through).toBe('old0000');
    expect(weeks.at(0)?.commits.at(0)?.sha).toBe('3333333');
    expect(summarize).toHaveBeenCalledTimes(1);
  });

  it('should keep past weeks open without a model', async () => {
    const { weeks } = await buildAboutWeeks({ commits, authors, stored: none, summarize: null, now });
    expect(weeks.every(({ final, summary }) => !final && summary === null)).toBe(true);
  });
});
