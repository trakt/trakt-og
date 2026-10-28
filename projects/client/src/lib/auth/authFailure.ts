import { ErrorResponse } from 'oidc-client-ts';
import type { AuthScene } from './authScenes.ts';

export type AuthFailure = 'rateLimited' | 'unreachable';

// oidc-client-ts puts the status in the message ("Too Many Requests (429)"); Cloudflare's own refusal is code 1015.
const RATE_LIMITED = /\(429\)|too many requests|error code: 1015/i;

/** Why a step against auth.trakt.tv failed. A refusal the browser can't read the status of counts as unreachable. */
export function toAuthFailure(error: unknown): AuthFailure {
  return error instanceof Error && RATE_LIMITED.test(error.message) ? 'rateLimited' : 'unreachable';
}

/** The viewer turned down the sign in at auth.trakt.tv, so there's nothing to retry. */
export function isDeclinedSignIn(error: unknown): boolean {
  return error instanceof ErrorResponse && error.error === 'access_denied';
}

export const AUTH_FAILURE_MESSAGE: Readonly<Record<AuthScene, Readonly<Record<AuthFailure, string>>>> = {
  signIn: {
    rateLimited: 'Trakt is rate limiting sign-ins right now.',
    unreachable: "Couldn't reach Trakt to sign you in.",
  },
  return: {
    rateLimited: 'Trakt is rate limiting sign-ins right now.',
    unreachable: "Couldn't reach Trakt to finish signing you in.",
  },
  signOut: {
    rateLimited: 'Trakt is rate limiting sign-outs right now.',
    unreachable: "Couldn't reach Trakt to finish signing you out.",
  },
};
