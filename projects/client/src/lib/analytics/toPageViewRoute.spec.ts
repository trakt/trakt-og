import { describe, expect, it } from 'vitest';
import { toPageViewRoute } from './toPageViewRoute.ts';

describe('util: toPageViewRoute', () => {
  it('should keep the route template', () => {
    expect(toPageViewRoute('/movies/[slug]')).toBe('/movies/[slug]');
    expect(toPageViewRoute('/users/[slug]/lists')).toBe('/users/[slug]/lists');
  });

  it('should skip the sign-in and sign-out hops', () => {
    expect(toPageViewRoute('/signin')).toBeNull();
    expect(toPageViewRoute('/callback')).toBeNull();
    expect(toPageViewRoute('/signout')).toBeNull();
  });

  it('should skip the design demos', () => {
    expect(toPageViewRoute('/_design')).toBeNull();
    expect(toPageViewRoute('/_design/buttons')).toBeNull();
  });

  it('should skip an unmatched route', () => {
    expect(toPageViewRoute(null)).toBeNull();
    expect(toPageViewRoute(undefined)).toBeNull();
  });
});
