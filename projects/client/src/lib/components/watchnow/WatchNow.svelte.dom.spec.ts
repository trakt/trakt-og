import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWatchNowItem } from './loadWatchNowItem.ts';
import type { WatchNowButton } from './watchNow.ts';
import WatchNow from './WatchNow.svelte';

vi.mock('#lib/api/isStandardApi.ts', () => ({ isStandardApi: () => false }));
vi.mock('./loadWatchNowItem.ts', () => ({ loadWatchNowItem: vi.fn() }));
vi.mock('./fetchWatchNowShared.ts', () => ({ fetchWatchNowShared: vi.fn(async () => []) }));

const settle = async () => {
  await new Promise((done) => setTimeout(done, 0));
  flushSync();
};

const button = (path: string): WatchNowButton => ({
  path,
  tiles: [],
  count: 1,
  favorites: 0,
  cinemaOnly: false,
  hidden: false,
  country: 'us',
  favoriteKeys: [],
});

const mounted: Record<string, unknown>[] = [];
afterEach(() => {
  mounted.splice(0).forEach((component) => unmount(component));
  document.body.innerHTML = '';
  vi.mocked(loadWatchNowItem).mockReset();
});

const click = (selector: string) => {
  document.querySelector<HTMLButtonElement>(selector)?.click();
  flushSync();
};

describe('component: WatchNow', () => {
  it("should load the new episode's links when opened after navigating to it", async () => {
    vi.mocked(loadWatchNowItem)
      .mockResolvedValueOnce({ failed: false, offers: null, unavailable: true, countries: [], justwatch: {} })
      .mockResolvedValueOnce({ failed: false, offers: null, unavailable: false, countries: [], justwatch: {} });
    const props = $state({ button: button('/shows/x/seasons/1/episodes/1'), title: 'X' });
    mounted.push(mount(WatchNow, { target: document.body, props }));

    click('button.open');
    await settle();
    expect(document.body.textContent).toContain("isn't available with this API key");
    click('dialog button.close');

    props.button = button('/shows/x/seasons/1/episodes/2');
    flushSync();
    click('button.open');
    await settle();

    expect(vi.mocked(loadWatchNowItem).mock.calls.map(([{ path }]) => path)).toEqual([
      '/shows/x/seasons/1/episodes/1',
      '/shows/x/seasons/1/episodes/2',
    ]);
    expect(document.body.textContent).toContain('No watch now links in your country yet.');
  });
});
