import { isRedirect } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HeaderUser } from '../lib/components/header/HeaderUser.ts';
import { load } from './+page.server.ts';

const server = setupServer(http.all('*', () => new HttpResponse(null, { status: 503 })));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const visit = (user: HeaderUser | null) =>
  load({
    parent: async () => ({ user }),
    depends: () => {},
    fetch: globalThis.fetch,
    url: new URL('https://og.trakt.tv/'),
  } as unknown as Parameters<typeof load>[0]);

describe('route: /', () => {
  it('should send a signed-in viewer to the dashboard', async () => {
    const failure: unknown = await visit({ slug: 'og_tester' } as HeaderUser).catch((cause: unknown) => cause);

    expect(isRedirect(failure) && failure.location).toBe('/dashboard');
  });

  it('should render the home page when no user loaded', async () => {
    expect(await visit(null)).toMatchObject({ signedIn: false, fanarts: [], posters: null });
  });
});
