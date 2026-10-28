import { ErrorResponse } from 'oidc-client-ts';
import { describe, expect, it } from 'vitest';
import { isDeclinedSignIn, toAuthFailure } from './authFailure.ts';

describe('authFailure', () => {
  describe('toAuthFailure', () => {
    it.each([
      ['a 429 without a body', new Error('Too Many Requests (429)')],
      ['a 429 with a JSON body', new Error('Too Many Requests (429): {"message":"slow down"}')],
      ["Cloudflare's rate limit page", new Error('error code: 1015')],
    ])('should read %s as rate limited', (_, error) => {
      expect(toAuthFailure(error)).toBe('rateLimited');
    });

    it.each([
      ['a blocked or offline fetch', new TypeError('Failed to fetch')],
      ['a server error', new Error('Internal Server Error (500)')],
      ['an unexpected page', new Error('Invalid response Content-Type: text/html, from URL: https://auth.trakt.tv')],
      ['something that is not an error', 'nope'],
    ])('should read %s as unreachable', (_, error) => {
      expect(toAuthFailure(error)).toBe('unreachable');
    });
  });

  describe('isDeclinedSignIn', () => {
    it('should spot a viewer turning the sign in down', () => {
      expect(isDeclinedSignIn(new ErrorResponse({ error: 'access_denied' }))).toBe(true);
    });

    it('should leave other failures to retry', () => {
      expect(isDeclinedSignIn(new ErrorResponse({ error: 'invalid_grant' }))).toBe(false);
      expect(isDeclinedSignIn(new Error('Too Many Requests (429)'))).toBe(false);
    });
  });
});
