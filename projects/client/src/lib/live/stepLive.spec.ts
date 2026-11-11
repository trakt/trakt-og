import type { HomeTrendingTitle } from '#lib/home/live/toHomeTrending.ts';
import { describe, expect, it } from 'vitest';
import { EMPTY_LIVE, type LiveReads, stepLive } from './stepLive.ts';

const title = (slug: string): HomeTrendingTitle => ({
  key: `shows-${slug}`,
  type: 'shows',
  slug,
  title: slug,
  year: 2026,
  href: `/shows/${slug}`,
});
const MINUTE_MS = 60_000;

function readsOf(slugs: readonly string[], freshFor: ReadonlyMap<string, number> = new Map()) {
  const asked: string[] = [];
  const reads: LiveReads = {
    trending: async () => ({ value: { shows: slugs.map(title), movies: [] }, freshForMs: null }),
    total: async () => ({ value: { shows: 1000, movies: 500 }, freshForMs: null }),
    watching: async ({ type, slug, title: name, href }) => {
      asked.push(slug);
      const source = { type, title: name, href, watchers: [{ username: `${slug}-fan`, location: 'Brazil' }] };
      return { source, freshForMs: freshFor.get(slug) ?? null };
    },
  };
  return { reads, asked };
}

const random = () => 0.5;

describe('stepLive', () => {
  it('should read trending, the total and every title on the first step', async () => {
    const { reads, asked } = readsOf(['a', 'b']);
    const state = await stepLive({ state: EMPTY_LIVE, reads, now: 0, random });

    expect(asked).toEqual(['a', 'b']);
    expect(state.total?.value).toEqual({ shows: 1000, movies: 500 });
    expect(Object.keys(state.watching)).toEqual(['shows/a', 'shows/b']);
  });

  it('should spread the first reads across the next 3 minutes, so changes start on the next steps', async () => {
    const slugs = Array.from({ length: 18 }, (_, i) => `t${i}`);
    const turns = slugs.map((_, i) => i / slugs.length);
    const state = await stepLive({
      state: EMPTY_LIVE,
      reads: readsOf(slugs).reads,
      now: 0,
      random: () => turns.shift() ?? 0,
    });
    const later = readsOf(slugs);
    await stepLive({ state, reads: later.reads, now: 20_000, random });

    expect(later.asked).toEqual(['t0', 't1', 't2']);
  });

  it("should read a title again just after the API's copy of it runs out", async () => {
    const freshFor = new Map([
      ['a', 30_000],
      ['b', 150_000],
    ]);
    const state = await stepLive({ state: EMPTY_LIVE, reads: readsOf(['a', 'b'], freshFor).reads, now: 0, random });
    const later = readsOf(['a', 'b']);
    await stepLive({ state, reads: later.reads, now: 40_000, random });

    expect(later.asked).toEqual(['a']);
  });

  it('should read nothing until something is due, and hand back the same state', async () => {
    const first = readsOf(['a', 'b']);
    const state = await stepLive({ state: EMPTY_LIVE, reads: first.reads, now: 0, random });
    const later = readsOf(['a', 'b']);
    const next = await stepLive({ state, reads: later.reads, now: 10_000, random });

    expect(later.asked).toEqual([]);
    expect(next).toBe(state);
  });

  it("should read trending again only after the API's hour-long copy runs out", async () => {
    let asked = 0;
    const { reads } = readsOf(['a']);
    const counted: LiveReads = {
      ...reads,
      trending: async () => {
        asked += 1;
        return { value: { shows: [title('a')], movies: [] }, freshForMs: 30 * MINUTE_MS };
      },
    };
    const state = await stepLive({ state: EMPTY_LIVE, reads: counted, now: 0, random });
    await stepLive({ state, reads: counted, now: 20 * MINUTE_MS, random });
    await stepLive({ state, reads: counted, now: 31 * MINUTE_MS, random });

    expect(asked).toBe(2);
  });

  it('should read a due title again after its 3 minutes, at most 12 a step', async () => {
    const slugs = Array.from({ length: 20 }, (_, i) => `t${i}`);
    const first = readsOf(slugs);
    const state = await stepLive({ state: EMPTY_LIVE, reads: first.reads, now: 0, random });
    const later = readsOf(slugs);
    await stepLive({ state, reads: later.reads, now: 4 * MINUTE_MS, random });

    expect(later.asked).toHaveLength(12);
  });

  it('should drop a title that left trending', async () => {
    const state = await stepLive({ state: EMPTY_LIVE, reads: readsOf(['a', 'b']).reads, now: 0, random });
    const next = await stepLive({ state, reads: readsOf(['b']).reads, now: 16 * MINUTE_MS, random });

    expect(Object.keys(next.watching)).toEqual(['shows/b']);
  });

  it('should wait a minute before reading a failed title again, and read at most 30 new titles a step', async () => {
    const slugs = Array.from({ length: 40 }, (_, i) => `t${i}`);
    const asked: string[] = [];
    const { reads } = readsOf(slugs);
    const failing: LiveReads = {
      ...reads,
      watching: async ({ slug }) => {
        asked.push(slug);
        return null;
      },
    };
    const state = await stepLive({ state: EMPTY_LIVE, reads: failing, now: 0, random });
    expect(asked).toHaveLength(30);

    asked.length = 0;
    const next = await stepLive({ state, reads: failing, now: 10_000, random });
    expect(asked).toEqual(slugs.slice(30));

    asked.length = 0;
    await stepLive({ state: next, reads: failing, now: 20_000, random });
    expect(asked).toEqual([]);
  });

  it('should keep the last trending and title when a read fails', async () => {
    const state = await stepLive({ state: EMPTY_LIVE, reads: readsOf(['a']).reads, now: 0, random });
    const failing: LiveReads = {
      trending: () => Promise.reject(new Error('down')),
      total: async () => null,
      watching: async () => null,
    };
    const next = await stepLive({ state, reads: failing, now: 20 * MINUTE_MS, random });

    expect(next.trending?.value).toEqual(state.trending?.value);
    expect(next.total?.value).toEqual(state.total?.value);
    expect(next.watching['shows/a']?.source).toEqual(state.watching['shows/a']?.source);
    expect(next.watching['shows/a']?.due).toBe(20 * MINUTE_MS + MINUTE_MS);
  });
});
