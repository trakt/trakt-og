import type { RobotsTxt } from './RobotsTxt.ts';

const toPattern = (path: string) => {
  const anchored = path.endsWith('$');
  const body = (anchored ? path.slice(0, -1) : path)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
};

/**
 * Whether `agent` may crawl `path` (with its query), by Google's rules: every group naming the agent applies, else
 * every `*` group; the longest matching rule wins, and Allow wins a tie.
 */
export function isAllowedByRobots(robots: RobotsTxt, agent: string, path: string): boolean {
  const named = robots.groups.filter((group) => group.agents.includes(agent.toLowerCase()));
  const groups = named.length > 0 ? named : robots.groups.filter((group) => group.agents.includes('*'));
  const matches = groups
    .flatMap((group) => group.rules)
    .filter((rule) => rule.path !== '' && toPattern(rule.path).test(path))
    .toSorted((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));

  return matches.at(0)?.allow ?? true;
}
