import { describe, expect, it, vi } from 'vitest';
import { convertToSmartList } from './convertToSmartList.ts';

const draft = {
  source: 'discover' as const,
  mediaType: 'movies' as const,
  filters: { studios: ['a24'] },
  confidence: 0.9,
};
const params = { list: 'a24-movies', name: 'A24 Movies', privacy: 'public' as const, draft };

describe('util: convertToSmartList', () => {
  it("should send the list's name and privacy with the setup", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ ids: { trakt: 1, slug: 'x' } }), { status: 201 }));
    await expect(convertToSmartList({ request, ...params })).resolves.toBe('converted');
    expect(request).toHaveBeenCalledWith('/users/me/lists/a24-movies/smart-list-draft/convert', 'POST', {
      name: 'A24 Movies',
      privacy: 'public',
      source: 'discover',
      media_type: 'movies',
      filters: { studios: ['a24'] },
    });
  });

  it.each([
    [420, 'limit'],
    [404, 'failed'],
    [200, 'converted'],
  ])('should read a %i as %s', async (status, outcome) => {
    const request = async () => new Response(null, { status });
    await expect(convertToSmartList({ request, ...params })).resolves.toBe(outcome);
  });
});
