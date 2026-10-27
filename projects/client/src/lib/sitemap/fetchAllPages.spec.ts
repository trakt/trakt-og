import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages } from './fetchAllPages.ts';

type Page = { status: 200; headers: Headers; body: number[] } | { status: 500; headers: Headers; body: unknown };

const page = (body: number[], pageCount: number): Page => ({
  status: 200,
  headers: new Headers({ 'x-pagination-page-count': `${pageCount}` }),
  body,
});
const failed: Page = { status: 500, headers: new Headers(), body: null };

describe('util: fetchAllPages', () => {
  it('should read every page the first one counts, in order, up to the cap', async () => {
    const fetchPage = vi.fn((n: number) => Promise.resolve(page([n], 5)));

    expect(await fetchAllPages({ fetchPage, maxPages: 3 })).toEqual([[1], [2], [3]]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('should read one page when the API sends no page count', async () => {
    const fetchPage = vi.fn(() => Promise.resolve<Page>({ status: 200, headers: new Headers(), body: [1] }));

    expect(await fetchAllPages({ fetchPage, maxPages: 8 })).toEqual([[1]]);
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it('should give null and read nothing more when the first page fails', async () => {
    const fetchPage = vi.fn(() => Promise.resolve(failed));

    expect(await fetchAllPages({ fetchPage, maxPages: 8 })).toBeNull();
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it('should give null when the first page throws', async () => {
    expect(await fetchAllPages({ fetchPage: () => Promise.reject(new Error('offline')), maxPages: 8 })).toBeNull();
  });

  it('should give null, not a short list, when a later page fails', async () => {
    const fetchPage = (n: number) => Promise.resolve(n === 2 ? failed : page([n], 3));

    expect(await fetchAllPages({ fetchPage, maxPages: 8 })).toBeNull();
  });
});
