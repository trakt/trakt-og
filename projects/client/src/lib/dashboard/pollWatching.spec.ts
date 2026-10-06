import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pollWatching } from './pollWatching.ts';

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

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('pollWatching', () => {
  it('should ask at once and every 2 minutes while the page is visible', async () => {
    const page = fakePage();
    const load = vi.fn(() => Promise.resolve(1));
    const onupdate = vi.fn();

    const stop = pollWatching({ load, onupdate, page });
    await vi.advanceTimersByTimeAsync(4 * 60_000);

    expect(load).toHaveBeenCalledTimes(3);
    expect(onupdate).toHaveBeenCalledWith(1);
    stop();
  });

  it('should stop while hidden and ask again when shown', async () => {
    const page = fakePage();
    const load = vi.fn(() => Promise.resolve(1));
    const stop = pollWatching({ load, onupdate: () => {}, page });

    page.show('hidden');
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(load).toHaveBeenCalledTimes(1);

    page.show('visible');
    expect(load).toHaveBeenCalledTimes(2);
    stop();
  });

  it('should not ask from a hidden tab, and drop an answer that lands after it stops', async () => {
    const hidden = fakePage('hidden');
    const load = vi.fn(() => Promise.resolve(1));
    pollWatching({ load, onupdate: () => {}, page: hidden })();
    expect(load).not.toHaveBeenCalled();

    const onupdate = vi.fn();
    const stop = pollWatching({ load, onupdate, page: fakePage() });
    stop();
    await vi.advanceTimersByTimeAsync(5 * 60_000);

    expect(onupdate).not.toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should keep going after a failed load', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(2);
    const onupdate = vi.fn();
    const stop = pollWatching({ load, onupdate, page: fakePage() });

    await vi.advanceTimersByTimeAsync(2 * 60_000);

    expect(onupdate).toHaveBeenCalledExactlyOnceWith(2);
    stop();
  });
});
