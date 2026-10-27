import type { RobotsTxt } from './RobotsTxt.ts';

type RobotsGroup = RobotsTxt['groups'][number];

interface Line {
  key: string;
  value: string;
}

const toLine = (raw: string): Line | null => {
  const content = raw.replace(/#.*/, '').trim();
  const colon = content.indexOf(':');
  if (colon < 0) return null;
  return { key: content.slice(0, colon).trim().toLowerCase(), value: content.slice(colon + 1).trim() };
};

const addLine = (groups: readonly RobotsGroup[], line: Line): readonly RobotsGroup[] => {
  const last = groups.at(-1);
  if (line.key === 'user-agent') {
    const value = line.value.toLowerCase();
    if (last && last.rules.length === 0) return [...groups.slice(0, -1), { ...last, agents: [...last.agents, value] }];
    return [...groups, { agents: [value], rules: [] }];
  }
  if ((line.key !== 'allow' && line.key !== 'disallow') || !last) return groups;
  return [
    ...groups.slice(0, -1),
    { ...last, rules: [...last.rules, { allow: line.key === 'allow', path: line.value }] },
  ];
};

/** Parses robots.txt the way Google reads it: consecutive user-agent lines share one group, sitemaps are global. */
export function parseRobotsTxt(text: string): RobotsTxt {
  const lines = text
    .split(/\r?\n/)
    .map(toLine)
    .filter((line): line is Line => line !== null);

  return {
    groups: lines.reduce(addLine, []),
    sitemaps: lines.filter((line) => line.key === 'sitemap').map((line) => line.value),
  };
}
