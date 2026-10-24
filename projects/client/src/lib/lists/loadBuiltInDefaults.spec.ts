import { describe, expect, it } from 'vitest';
import { loadBuiltInDefaults } from './loadBuiltInDefaults.ts';

const answer =
  (headers: Record<string, string>, status = 200) =>
  () =>
    Promise.resolve(new Response(JSON.stringify([]), { status, headers }));

describe('loadBuiltInDefaults', () => {
  it("should read the owner's default sort from the headers", async () => {
    const request = answer({ 'x-sort-by': 'added', 'x-sort-how': 'desc' });
    expect(await loadBuiltInDefaults({ kind: 'favorites', request })).toEqual({ by: 'added', how: 'desc' });
  });

  it('should fall back to rank, ascending, without the headers', async () => {
    expect(await loadBuiltInDefaults({ kind: 'watchlist', request: answer({}) })).toEqual({ by: 'rank', how: 'asc' });
  });

  it('should ask for one item of the right list', async () => {
    const paths: string[] = [];
    await loadBuiltInDefaults({
      kind: 'favorites',
      request: (path) => {
        paths.push(path);
        return answer({})();
      },
    });
    expect(paths).toEqual(['/users/me/favorites?limit=1']);
  });

  it('should throw when the read fails', async () => {
    await expect(loadBuiltInDefaults({ kind: 'watchlist', request: answer({}, 503) })).rejects.toThrow();
  });
});
