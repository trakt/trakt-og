import { describe, expect, it } from 'vitest';
import { fetchAboutGithub } from './fetchAboutGithub.ts';

const issue = (number: number, label: string | null, created: string, closed: string | null = null) => ({
  number,
  title: `Issue ${number}`,
  labels: label ? [{ name: label }] : [],
  created_at: created,
  closed_at: closed,
});

const responses: Record<string, unknown> = {
  '/repos/trakt/trakt-og': { stargazers_count: 21, forks_count: 3 },
  open: {
    total_count: 7,
    items: [issue(159, null, '2026-10-22T10:00:00Z'), issue(109, 'bug', '2026-10-09T10:00:00Z')],
  },
  closed: {
    total_count: 37,
    items: [
      issue(105, 'enhancement', '2026-10-01T10:00:00Z', '2026-10-09T10:00:00Z'),
      issue(150, 'enhancement', '2026-10-20T10:00:00Z', '2026-10-21T10:00:00Z'),
    ],
  },
  commits: [{
    sha: 'edf4f41b0',
    html_url: 'https://github.com/trakt/trakt-og/commit/edf4f41b0',
    commit: { message: 'feat(media): trim logos', committer: { date: '2026-10-22T14:09:00Z' } },
    author: null,
  }],
};

const keyOf = (url: URL) => {
  if (url.pathname === '/search/issues') return url.searchParams.get('q')?.includes('is:open') ? 'open' : 'closed';
  return url.pathname.endsWith('/commits') ? 'commits' : url.pathname;
};

const seen: Headers[] = [];
const fakeFetch = (fail = new Set<string>()): typeof globalThis.fetch => (input, init) => {
  seen.push(new Headers(init?.headers));
  const key = keyOf(new URL(String(input)));
  if (fail.has(key)) return Promise.resolve(new Response('rate limited', { status: 403 }));
  // GitHub pages the one-a-page commit list, so the last page's number is the total.
  const link = new URL(String(input)).searchParams.get('per_page') === '1'
    ? { link: '<https://api.github.com/repositories/1/commits?per_page=1&page=321>; rel="last"' }
    : undefined;
  return Promise.resolve(Response.json(responses[key], { headers: link }));
};

describe('fetchAboutGithub', () => {
  it('should read the stars, both issue lists with their totals and the latest commits', async () => {
    const github = await fetchAboutGithub({ fetch: fakeFetch() });

    expect(github.stars).toBe(21);
    expect(github.forks).toBe(3);
    expect(github.commitCount).toBe(321);
    expect(github.open).toEqual({
      total: 7,
      issues: [
        { number: 159, title: 'Issue 159', label: null, at: '2026-10-22T10:00:00Z' },
        { number: 109, title: 'Issue 109', label: 'bug', at: '2026-10-09T10:00:00Z' },
      ],
    });
    expect(github.commits.map((commit) => commit.sha)).toEqual(['edf4f41']);
  });

  it('should list closed issues newest closed first', async () => {
    const github = await fetchAboutGithub({ fetch: fakeFetch() });

    expect(github.closed.total).toBe(37);
    expect(github.closed.issues.map((closed) => closed.number)).toEqual([150, 105]);
  });

  it('should throw when GitHub refuses any part, so nothing half-empty is cached', async () => {
    await expect(fetchAboutGithub({ fetch: fakeFetch(new Set(['commits'])) })).rejects.toThrow('403');
  });

  it('should name itself, since GitHub refuses a request without a user agent', async () => {
    seen.length = 0;
    await fetchAboutGithub({ fetch: fakeFetch() });

    expect(seen.every((headers) => headers.get('user-agent') === 'og.trakt.tv')).toBe(true);
  });

  it('should send the token when there is one', async () => {
    seen.length = 0;
    await fetchAboutGithub({ fetch: fakeFetch(), token: 'secret' });

    expect(seen.every((headers) => headers.get('authorization') === 'Bearer secret')).toBe(true);
  });
});
