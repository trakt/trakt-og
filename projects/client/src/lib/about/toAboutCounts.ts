import circleCheck from '../icons/regular/circle-check.svg?raw';
import circleDot from '../icons/regular/circle-dot.svg?raw';
import codeCommit from '../icons/regular/code-commit.svg?raw';
import codeFork from '../icons/regular/code-fork.svg?raw';
import star from '../icons/regular/star.svg?raw';
import type { AboutGithub } from './github/fetchAboutGithub.ts';
import { ogRepoUrls } from './ogRepoUrls.ts';

export type AboutCount = 'stars' | 'forks' | 'commits' | 'open' | 'closed';

const ALL: readonly AboutCount[] = ['stars', 'forks', 'commits', 'open', 'closed'];

/** A count's pill, which TagPills takes as is. */
type CountPill = { icon: string; tint: string; href: string; lead: string; text: string };

const pill = (count: { icon: string; tint: string; href: string; value: number; one: string; many: string }) => ({
  icon: count.icon,
  tint: count.tint,
  href: count.href,
  lead: count.value.toLocaleString('en-US'),
  text: count.value === 1 ? count.one : count.many,
});

const countOf = (github: AboutGithub, key: AboutCount): CountPill | null => {
  switch (key) {
    case 'stars':
      return pill({
        icon: star,
        tint: 'var(--color-github-star)',
        href: ogRepoUrls.stargazers,
        value: github.stars,
        one: 'star',
        many: 'stars',
      });
    case 'forks':
      return github.forks == null
        ? null
        : pill({
            icon: codeFork,
            tint: 'var(--color-github-forks)',
            href: ogRepoUrls.forks,
            value: github.forks,
            one: 'fork',
            many: 'forks',
          });
    case 'commits':
      return !github.commitCount
        ? null
        : pill({
            icon: codeCommit,
            tint: 'var(--color-github-commits)',
            href: ogRepoUrls.commits,
            value: github.commitCount,
            one: 'commit',
            many: 'commits',
          });
    case 'open':
      return pill({
        icon: circleDot,
        tint: 'var(--color-github-open)',
        href: ogRepoUrls.openIssues,
        value: github.open.total,
        one: 'open issue',
        many: 'open issues',
      });
    case 'closed':
      return pill({
        icon: circleCheck,
        tint: 'var(--color-github-closed)',
        href: ogRepoUrls.closedIssues,
        value: github.closed.total,
        one: 'closed issue',
        many: 'closed issues',
      });
  }
};

/**
 * The repo's GitHub counts as pills in GitHub's own colors, each linking to that list on GitHub, in the order asked.
 * A count GitHub didn't give (a cached copy from before it was read) stays out.
 */
export function toAboutCounts(github: AboutGithub | null, keys: readonly AboutCount[] = ALL): readonly CountPill[] {
  if (!github) return [];
  return keys.map((key) => countOf(github, key)).filter((count) => count !== null);
}
