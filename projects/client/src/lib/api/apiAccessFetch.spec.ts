import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiAccessFetch } from './apiAccessFetch.ts';
import { apiEnvironment } from './apiEnvironment.ts';
import { rateLimitPause } from './rateLimitPause.ts';

const environment = vi.hoisted(() => ({ dev: true, browser: false }));
vi.mock('$app/environment', () => environment);

const answer = (status: number) => vi.fn(() => Promise.resolve(new Response(null, { status })));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiAccessFetch', () => {
  describe('on standard', () => {
    const standard = apiEnvironment('standard');

    it('should refuse an Official-only route without a request', async () => {
      const fetch = answer(200);

      const response = await apiAccessFetch({ fetch, environment: standard })(`${standard}/v3/users/me/lists`);

      expect(response.status).toBe(403);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send every other route', async () => {
      const fetch = answer(200);

      const response = await apiAccessFetch({ fetch, environment: standard })(`${standard}/movies/x`);

      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledOnce();
    });
  });

  describe('on standard in the browser, after a 429', () => {
    const standard = apiEnvironment('standard');

    afterEach(() => {
      environment.browser = false;
      rateLimitPause.start('0', 0);
    });

    it('should answer 429 itself until Retry-After runs out', async () => {
      environment.browser = true;
      const access = apiAccessFetch({
        fetch: () => Promise.resolve(new Response(null, { status: 429, headers: { 'retry-after': '120' } })),
        environment: standard,
      });
      await access(`${standard}/sync/last_activities`);
      const fetch = answer(200);

      const held = await apiAccessFetch({ fetch, environment: standard })(`${standard}/movies/x`);

      expect(held.status).toBe(429);
      expect(Number(held.headers.get('retry-after'))).toBeGreaterThan(100);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('on production', () => {
    const production = apiEnvironment('production');

    it('should send Official-only routes, for the API to answer', async () => {
      const fetch = answer(200);

      await apiAccessFetch({ fetch, environment: production })(`${production}/watchnow/sources/us`);

      expect(fetch).toHaveBeenCalledOnce();
    });

    it('should hint once in dev that a refused client ID looks Standard', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const access = apiAccessFetch({ fetch: answer(403), environment: production });

      await access(`${production}/movies/x`);
      await access(`${production}/shows/x`);

      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls.at(0)?.at(0)).toMatch(/PUBLIC_TRAKT_API=standard/);
    });

    it('should not hint for an Official-only route’s 403', async () => {
      vi.resetModules();
      const { apiAccessFetch: fresh } = await import('./apiAccessFetch.ts');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await fresh({ fetch: answer(403), environment: production })(`${production}/v3/users/me/lists`);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
