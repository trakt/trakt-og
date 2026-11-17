import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { goto, page } from '../../test/shallowRouter.svelte.ts';
import { replaceQuery } from './replaceQuery.ts';

vi.mock('$app/state', async () => ({ page: (await import('../../test/shallowRouter.svelte.ts')).page }));
vi.mock('$app/navigation', async () => ({ goto: (await import('../../test/shallowRouter.svelte.ts')).goto }));

const cleanups: (() => void)[] = [];

beforeEach(() => {
  page.url = new URL('https://og.trakt.tv/users/sean/lists');
  page.shallow = null;
});

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  goto.mockClear();
});

describe('util: replaceQuery', () => {
  it('should navigate once when an effect syncs a new query', () => {
    let search = $state('');
    cleanups.push(
      $effect.root(() => {
        $effect(() => replaceQuery(search));
      }),
    );
    flushSync();

    search = '?sort=title,asc';
    flushSync();

    expect(goto).toHaveBeenCalledOnce();
    expect(goto).toHaveBeenCalledWith('/users/sean/lists?sort=title,asc', { shallow: true, replace: true, state: {} });
  });

  it('should not navigate when the query already matches the shallow url', () => {
    page.shallow = { url: new URL('https://og.trakt.tv/users/sean/lists?sort=rank,asc') };

    replaceQuery('?sort=rank,asc');

    expect(goto).not.toHaveBeenCalled();
  });
});
