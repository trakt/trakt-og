import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { afterVisibleFor } from './afterVisibleFor.ts';

function page(visible: boolean) {
  const target = new EventTarget();
  const doc = Object.assign(target, { visibilityState: visible ? 'visible' : 'hidden' }) as unknown as Document;
  const show = (on: boolean) => {
    Object.assign(doc, { visibilityState: on ? 'visible' : 'hidden' });
    target.dispatchEvent(new Event('visibilitychange'));
  };
  return { doc, show };
}

describe('util: afterVisibleFor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should run once the page has been in view long enough', () => {
    const callback = vi.fn();
    afterVisibleFor({ ms: 5000, callback, document: page(true).doc });
    vi.advanceTimersByTime(4999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should not count time in a background tab', () => {
    const callback = vi.fn();
    const { doc, show } = page(true);
    afterVisibleFor({ ms: 5000, callback, document: doc });
    vi.advanceTimersByTime(3000);
    show(false);
    vi.advanceTimersByTime(60000);
    expect(callback).not.toHaveBeenCalled();
    show(true);
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should never run once cancelled', () => {
    const callback = vi.fn();
    const cancel = afterVisibleFor({ ms: 5000, callback, document: page(true).doc });
    cancel();
    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });
});
