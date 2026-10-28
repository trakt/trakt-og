import { describe, expect, it } from 'vitest';
import { isAuthStepRoute } from './isAuthStepRoute.ts';

describe('isAuthStepRoute', () => {
  it.each(['/signin', '/callback', '/signout'])('should match %s', (id) => {
    expect(isAuthStepRoute(id)).toBe(true);
  });

  it.each(['/', '/dashboard', '/login', '/logout', '/users/[id]', null, undefined])('should not match %s', (id) => {
    expect(isAuthStepRoute(id)).toBe(false);
  });
});
