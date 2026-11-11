import { describe, expect, it, vi } from 'vitest';
import { refreshOnReturn } from './refreshOnReturn.ts';

function fakePage(visibilityState: DocumentVisibilityState = 'visible') {
  const target = new EventTarget();
  const page = {
    visibilityState,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    show(state: DocumentVisibilityState) {
      page.visibilityState = state;
      target.dispatchEvent(new Event('visibilitychange'));
    },
  };
  return page;
}

function setup(visibilityState?: DocumentVisibilityState) {
  const page = fakePage(visibilityState);
  let time = 0;
  const refresh = vi.fn();
  const stop = refreshOnReturn({ refresh, page, awayMs: 60_000, now: () => time });
  return { page, refresh, stop, wait: (ms: number) => (time += ms) };
}

describe('refreshOnReturn', () => {
  it('should refresh when the tab shows again after a minute away', () => {
    const { page, refresh, wait } = setup();

    page.show('hidden');
    wait(60_000);
    page.show('visible');

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('should not refresh after a quick look at another tab', () => {
    const { page, refresh, wait } = setup();

    page.show('hidden');
    wait(59_000);
    page.show('visible');

    expect(refresh).not.toHaveBeenCalled();
  });

  it('should count from when the tab was hidden, not from the last hidden event', () => {
    const { page, refresh, wait } = setup('hidden');

    wait(40_000);
    page.show('hidden');
    wait(20_000);
    page.show('visible');

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('should stop listening once stopped', () => {
    const { page, refresh, stop, wait } = setup();

    stop();
    page.show('hidden');
    wait(120_000);
    page.show('visible');

    expect(refresh).not.toHaveBeenCalled();
  });
});
