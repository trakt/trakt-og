import { ErrorResponse } from 'oidc-client-ts';

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

// Cloudflare's rate limit answer usually reaches the browser as a failed fetch, so unreachable names it too.
export const AUTH_FAILURE_STATUS: Readonly<Record<AuthFailure, string>> = {
  rateLimited: 'Rate limited',
  unreachable: 'Rate limited or offline',
};
