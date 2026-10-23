import { describe, expect, it } from 'vitest';
import { countedCommits } from './countedCommits.ts';

const commit = (subject: string, committedAt = '2026-10-21T10:00:00Z') => ({
  sha: 'abcdef1234567890',
  email: 'someone@example.com',
  committedAt,
  subject,
});

describe('util: countedCommits', () => {
  it('should read the type, scope and subject', () => {
    expect(countedCommits([commit('feat(users): show the ratings box')])).toEqual([{
      sha: 'abcdef1234567890',
      email: 'someone@example.com',
      week: '2026-10-19',
      type: 'feat',
      scope: 'users',
      subject: 'show the ratings box',
    }]);
  });

  it('should count only new features, fixes and speedups', () => {
    const log = [
      commit('feat(media): a'),
      commit('refactor(media): b'),
      commit('chore(deps): c'),
      commit('fix: d'),
      commit('perf(lists): e'),
      commit('docs(agents): f'),
    ];
    expect(countedCommits(log).map(({ type }) => type)).toEqual(['feat', 'fix', 'perf']);
  });

  it('should leave the scope empty when there is none', () => {
    expect(countedCommits([commit('fix: tidy the footer')]).at(0)?.scope).toBe('');
  });

  it('should read a breaking change marker and keep the first of several scopes', () => {
    expect(countedCommits([commit('feat(users, media)!: x')]).at(0)).toMatchObject({ scope: 'users', subject: 'x' });
  });

  it('should skip subjects that are not conventional', () => {
    expect(countedCommits([commit('Merge branch main'), commit('feature(users): x'), commit('fix(users) x')])).toEqual(
      [],
    );
  });

  it('should file each commit under the UTC Monday it landed in', () => {
    const [sunday, monday] = countedCommits([
      commit('fix: a', '2026-10-25T23:59:00Z'),
      commit('fix: b', '2026-10-25T17:30:00-07:00'),
    ]);
    expect(sunday?.week).toBe('2026-10-19');
    expect(monday?.week).toBe('2026-10-26');
  });
});
