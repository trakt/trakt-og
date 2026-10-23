import { describe, expect, it } from 'vitest';
import { toAboutCommit } from './toAboutCommit.ts';

const commit = (message: string, author: { login: string; avatar_url: string } | null = null) => ({
  sha: 'edf4f41b0c0ffee',
  html_url: 'https://github.com/trakt/trakt-og/commit/edf4f41b0c0ffee',
  commit: { message, committer: { date: '2026-10-22T14:09:00Z' } },
  author,
});

describe('toAboutCommit', () => {
  it('should read a conventional commit into a type tag, section and subject', () => {
    const view = toAboutCommit(
      commit('feat(media): trim the margins off logos\n\nLonger body.', { login: 'rectifyer', avatar_url: 'a.png' }),
    );

    expect(view).toEqual({
      sha: 'edf4f41',
      href: 'https://github.com/trakt/trakt-og/commit/edf4f41b0c0ffee',
      day: '2026-10-22',
      type: 'feat',
      section: 'Titles',
      subject: 'Trim the margins off logos',
      author: { login: 'rectifyer', avatar: 'a.png' },
    });
  });

  it('should keep housekeeping types, filed under General', () => {
    expect(toAboutCommit(commit('chore(deps): bump vite'))).toMatchObject({ type: 'chore', section: 'General' });
  });

  it('should leave a free-form message untyped under General', () => {
    expect(toAboutCommit(commit('Merge branch main'))).toMatchObject({
      type: null,
      section: 'General',
      subject: 'Merge branch main',
    });
  });
});
