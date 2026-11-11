import { describe, expect, it } from 'vitest';
import { cacheFreshFor } from './cacheFreshFor.ts';

const headers = (control: string | null, age?: string) =>
  new Headers({ ...(control && { 'cache-control': control }), ...(age && { age }) });

describe('cacheFreshFor', () => {
  it("should count down the shared cache's s-maxage by the copy's age", () => {
    expect(cacheFreshFor(headers('public, max-age=86400, s-maxage=180', '68'))).toBe(112_000);
  });

  it('should use max-age when there is no s-maxage, and a missing age as a fresh copy', () => {
    expect(cacheFreshFor(headers('public, max-age=60'))).toBe(60_000);
  });

  it('should say 0 for a copy past its time, and null with no cache time at all', () => {
    expect(cacheFreshFor(headers('public, s-maxage=180', '200'))).toBe(0);
    expect(cacheFreshFor(headers(null))).toBeNull();
  });
});
