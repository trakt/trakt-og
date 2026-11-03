import { ErrorResponse, ErrorTimeout } from 'oidc-client-ts';
import { describe, expect, it } from 'vitest';
import { toLoginFailureCode } from './toLoginFailureCode.ts';

describe('toLoginFailureCode', () => {
  it('should use the code the provider reported', () => {
    expect(toLoginFailureCode({ error: 'access_denied' })).toBe('access_denied');
    expect(toLoginFailureCode(new ErrorResponse({ error: 'access_denied' }))).toBe('access_denied');
  });

  it('should bucket an unrecognised or empty provider code as unknown', () => {
    expect(toLoginFailureCode({ error: 'jane@example.com' })).toBe('unknown');
    expect(toLoginFailureCode({ error: '' })).toBe('unknown');
  });

  it('should report a rate limit as http_429', () => {
    expect(toLoginFailureCode(new Error('Too Many Requests (429)'))).toBe('http_429');
  });

  it('should never leak an error message', () => {
    expect(toLoginFailureCode(new Error('jane@example.com is locked'))).toBe('unknown');
    expect(toLoginFailureCode(new Error('No state in response for jane@example.com'))).toBe('unknown');
  });

  it('should fall back for a thrown non-error', () => {
    expect(toLoginFailureCode(undefined)).toBe('unknown');
  });

  it.each([
    ['No matching state found in storage', 'state_mismatch'],
    ['State does not match', 'state_mismatch'],
    ['No state in response', 'no_state'],
    ['No client_id on state', 'invalid_state'],
    ['invalid request_type in state', 'invalid_state'],
    ['Expected code in response', 'no_code'],
    ['ID Token is missing a subject claim', 'invalid_id_token'],
    ['Invalid response Content-Type: text/html, from URL: https://example.com', 'invalid_response'],
    ['Metadata does not contain property token_endpoint', 'invalid_metadata'],
    ['Missing keys on keyset', 'invalid_metadata'],
    ['Crypto.subtle is available only in secure contexts (HTTPS).', 'crypto_unavailable'],
  ])('should map the library message "%s" to %s', (message, code) => {
    expect(toLoginFailureCode(new Error(message))).toBe(code);
  });

  it('should map a library timeout to timeout and a failed parse to parse_error', () => {
    expect(toLoginFailureCode(new ErrorTimeout('Network timed out'))).toBe('timeout');
    expect(toLoginFailureCode(new SyntaxError('Unexpected token <'))).toBe('parse_error');
  });

  it("should map every browser's fetch failure to network, and no other type error", () => {
    expect(
      [
        new TypeError('Failed to fetch'),
        new TypeError('NetworkError when attempting to fetch resource.'),
        new TypeError('Load failed'),
        new TypeError('Cannot read properties of null'),
      ].map(toLoginFailureCode),
    ).toEqual(['network', 'network', 'network', 'unknown']);
  });

  it('should prefer the provider code, then a rate limit, over a library match', () => {
    expect(toLoginFailureCode(Object.assign(new Error('State does not match'), { error: 'server_error' }))).toBe(
      'server_error',
    );
    expect(toLoginFailureCode(new TypeError('Too Many Requests (429)'))).toBe('http_429');
  });
});
