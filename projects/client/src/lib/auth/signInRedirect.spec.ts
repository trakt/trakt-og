import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { signInRedirect } from './signInRedirect.ts';

describe('auth: signInRedirect', () => {
  it('should redirect with a 302 to the sign-in href', () => {
    try {
      signInRedirect(new URL('https://og.trakt.tv/shows/recommendations?page=2'));
    } catch (error) {
      if (!isRedirect(error)) throw error;
      expect(error.status).toBe(302);
      expect(error.location).toBe('/signin?redirect_to=%2Fshows%2Frecommendations%3Fpage%3D2');
      return;
    }
    throw new Error('did not redirect');
  });
});
