import { traktUrls } from '../traktUrls.ts';

const repo = traktUrls.github;

/** The OG Redux repo on GitHub: new bug reports and feature requests come in with their labels already set. */
export const ogRepoUrls = {
  repo,
  clone: `${repo}.git`,
  stargazers: `${repo}/stargazers`,
  forks: `${repo}/forks`,
  newBug: `${repo}/issues/new?labels=bug`,
  newFeature: `${repo}/issues/new?labels=enhancement`,
  openIssues: `${repo}/issues`,
  closedIssues: `${repo}/issues?q=is%3Aissue+is%3Aclosed`,
  commits: `${repo}/commits/main`,
  readme: `${repo}/blob/main/README.md`,
  issue: (number: number) => `${repo}/issues/${number}`,
  commit: (sha: string) => `${repo}/commit/${sha}`,
} as const;
