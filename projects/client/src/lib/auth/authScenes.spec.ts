import { describe, expect, it } from 'vitest';
import { AUTH_SCENES, authLine } from './authScenes.ts';

describe('authLine', () => {
  it("should be the scene's own line while the step runs", () => {
    expect(authLine('signOut')).toEqual(AUTH_SCENES.signOut);
    expect(authLine('signIn', null)).toEqual(AUTH_SCENES.signIn);
  });

  it('should swap in a quote for each failure and keep the rest of the scene', () => {
    const limited = authLine('return', 'rateLimited');
    const unreachable = authLine('return', 'unreachable');

    expect(limited).toEqual({ ...AUTH_SCENES.return, quote: limited.quote });
    expect(new Set([AUTH_SCENES.return.quote, limited.quote, unreachable.quote]).size).toBe(3);
  });
});
