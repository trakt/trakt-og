import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { canonicalRedirect } from './canonicalRedirect.ts';

const url = new URL('https://og.trakt.tv/movies/tron-1982/comments/bogus?page=2');

const outcome = (requested: string, canonical: string) => {
  try {
    canonicalRedirect({ requested, canonical, url });
    return null;
  } catch (thrown) {
    if (isRedirect(thrown)) return thrown;
    throw thrown;
  }
};

describe('routing: canonicalRedirect', () => {
  it('should let a canonical path through', () => {
    expect(outcome('/movies/tron-1982/comments', '/movies/tron-1982/comments')).toBeNull();
  });

  it('should 301 any other spelling to the canonical path and keep the query', () => {
    const result = outcome('/movies/tron-1982/comments/bogus', '/movies/tron-1982/comments');
    expect(result?.status).toBe(301);
    expect(result?.location).toBe('/movies/tron-1982/comments?page=2');
  });
});
