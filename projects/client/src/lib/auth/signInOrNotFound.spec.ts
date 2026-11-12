import { isHttpError, isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { signInOrNotFound } from './signInOrNotFound.ts';

const url = new URL('https://og.trakt.tv/users/tester/lists/secret');
const outcome = (locals: Parameters<typeof signInOrNotFound>[0]['locals']) => {
  try {
    signInOrNotFound({ locals, url, message: 'List not found' });
  } catch (thrown) {
    if (isRedirect(thrown)) return thrown.location;
    if (isHttpError(thrown)) return `${thrown.status} ${thrown.body.message}`;
    throw thrown;
  }
  return null;
};

describe('auth: signInOrNotFound', () => {
  it('should send a signed-out visitor to sign in and back', () => {
    expect(outcome({ token: null })).toBe('/signin?redirect_to=%2Fusers%2Ftester%2Flists%2Fsecret');
  });

  it('should 404 for a signed-in viewer', () => {
    expect(outcome({ token: 'fake-token' })).toBe('404 List not found');
  });

  it('should 404 for a crawler', () => {
    expect(outcome({ token: null, crawler: { verified: true, bot: true, headOnly: false } })).toBe(
      '404 List not found',
    );
  });
});
