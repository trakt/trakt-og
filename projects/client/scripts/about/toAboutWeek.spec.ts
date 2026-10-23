import { describe, expect, it } from 'vitest';
import type { CountedCommit } from './CountedCommit.ts';
import { toAboutWeek } from './toAboutWeek.ts';

const commit = (sha: string, type: CountedCommit['type'], scope: string, email = 'a@example.com'): CountedCommit => ({
  sha: `${sha}000000000`,
  email,
  week: '2026-10-19',
  type,
  scope,
  subject: `subject ${sha}`,
});

const authors = new Map([
  ['a@example.com', { login: 'alice', avatar: 'https://avatars.githubusercontent.com/u/1' }],
  ['b@example.com', { login: 'bob', avatar: 'https://avatars.githubusercontent.com/u/2' }],
  ['b@work.example.com', { login: 'bob', avatar: 'https://avatars.githubusercontent.com/u/2' }],
]);

const build = (commits: ReadonlyArray<CountedCommit>) =>
  toAboutWeek({
    week: '2026-10-19',
    commits,
    authors,
    summary: null,
    final: false,
    now: new Date('2026-10-22T08:00:00Z'),
  });

describe('util: toAboutWeek', () => {
  it('should span Monday to Sunday', () => {
    expect(build([commit('1111111', 'feat', 'users')])).toMatchObject({
      week: '2026-10-19',
      from: '2026-10-19',
      to: '2026-10-25',
      updatedAt: '2026-10-22T08:00:00.000Z',
      final: false,
      summary: null,
    });
  });

  it('should count new features, fixes and speedups', () => {
    const week = build([
      commit('1', 'feat', 'a'),
      commit('2', 'fix', 'a'),
      commit('3', 'fix', 'a'),
      commit('4', 'perf', 'a'),
    ]);
    expect(week.counts).toEqual({ new: 1, fixed: 2, faster: 1 });
  });

  it('should sort sections by count, then by the about page order', () => {
    const week = build([
      commit('1', 'feat', 'ci'),
      commit('2', 'feat', 'calendars'),
      commit('3', 'fix', 'users'),
      commit('4', 'fix', 'users'),
    ]);
    expect(week.sections).toEqual([
      { name: 'Profiles', count: 2 },
      { name: 'Calendar', count: 1 },
      { name: 'General', count: 1 },
    ]);
  });

  it('should list authors by commit count with their avatars and no emails', () => {
    const week = build([
      commit('1', 'feat', 'a', 'a@example.com'),
      commit('2', 'feat', 'a', 'b@example.com'),
      commit('3', 'feat', 'a', 'b@work.example.com'),
      commit('4', 'feat', 'a', 'nobody@example.com'),
    ]);
    expect(week.authors).toEqual([
      { login: 'bob', avatar: 'https://avatars.githubusercontent.com/u/2' },
      { login: 'alice', avatar: 'https://avatars.githubusercontent.com/u/1' },
    ]);
    expect(JSON.stringify(week)).not.toContain('@example.com');
  });

  it('should keep commits newest first with short shas and a null author when there is no account', () => {
    const week = build([commit('2222222', 'fix', 'lists', 'nobody@example.com'), commit('1111111', 'feat', 'users')]);
    expect(week.commits).toEqual([
      { sha: '2222222', type: 'fix', scope: 'lists', subject: 'subject 2222222', author: null },
      { sha: '1111111', type: 'feat', scope: 'users', subject: 'subject 1111111', author: 'alice' },
    ]);
    expect(week.lastCommit).toBe('2222222');
  });
});
