import { describe, expect, it } from 'vitest';
import type { AboutGithub } from './github/fetchAboutGithub.ts';
import { toAboutCounts } from './toAboutCounts.ts';

const github: AboutGithub = {
  stars: 25,
  forks: 1,
  open: { total: 21, issues: [] },
  closed: { total: 1048, issues: [] },
  commits: [],
  commitCount: 6175,
};

describe('toAboutCounts', () => {
  it('should show every count in order, with its number and a singular or plural name', () => {
    expect(toAboutCounts(github).map(({ lead, text }) => `${lead} ${text}`)).toEqual([
      '25 stars',
      '1 fork',
      '6,175 commits',
      '21 open issues',
      '1,048 closed issues',
    ]);
  });

  it('should show only the counts asked for', () => {
    expect(toAboutCounts(github, ['open', 'closed'])).toMatchObject([
      { text: 'open issues', href: 'https://github.com/trakt/trakt-og/issues' },
      { text: 'closed issues', href: 'https://github.com/trakt/trakt-og/issues?q=is%3Aissue+is%3Aclosed' },
    ]);
  });

  it('should leave out what an old cached copy is missing, and everything when GitHub failed', () => {
    expect(toAboutCounts({ ...github, forks: null, commitCount: null }).map(({ text }) => text)).toEqual([
      'stars',
      'open issues',
      'closed issues',
    ]);
    expect(toAboutCounts(null)).toEqual([]);
  });
});
