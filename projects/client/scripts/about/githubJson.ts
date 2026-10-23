interface GithubJsonParams {
  /** A REST path with its query, like `/repos/owner/name`. */
  readonly path: string;
  /** Optional; public reads work without one at a lower rate limit. */
  readonly token?: string;
}

/** A GitHub REST response body, or throws on any status but 200. */
export async function githubJson({ path, token }: GithubJsonParams): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${path.split('?').at(0)}`);
  return response.json();
}
