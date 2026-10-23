import { afterEach, describe, expect, it, vi } from 'vitest';

type Entries = Parameters<IntersectionObserverCallback>[0];

function stubObserver() {
  const created: FakeObserver[] = [];
  class FakeObserver {
    observed = new Set<Element>();
    constructor(readonly callback: (entries: Entries) => void, readonly options?: IntersectionObserverInit) {
      created.push(this);
    }
    observe = (element: Element) => this.observed.add(element);
    unobserve = (element: Element) => this.observed.delete(element);
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return created;
}
const entry = (target: Element, isIntersecting: boolean) => ({ target, isIntersecting }) as IntersectionObserverEntry;

describe('onceInView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should serve every element with one observer', async () => {
    const created = stubObserver();
    const { onceInView } = await import('./onceInView.ts');
    onceInView({} as Element, () => {});
    onceInView({} as Element, () => {});
    expect(created).toHaveLength(1);
    expect(created[0]?.observed.size).toBe(2);
  });

  it('should call back once, on the first sighting, and stop watching', async () => {
    const created = stubObserver();
    const { onceInView } = await import('./onceInView.ts');
    const element = {} as Element;
    const callback = vi.fn();
    onceInView(element, callback);
    const [observer] = created;
    observer?.callback([entry(element, false)]);
    expect(callback).not.toHaveBeenCalled();
    observer?.callback([entry(element, true)]);
    observer?.callback([entry(element, true)]);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(observer?.observed.has(element)).toBe(false);
  });

  it('should stop watching and never call back after cleanup', async () => {
    const created = stubObserver();
    const { onceInView } = await import('./onceInView.ts');
    const element = {} as Element;
    const callback = vi.fn();
    const cleanup = onceInView(element, callback);
    cleanup();
    const [observer] = created;
    observer?.callback([entry(element, true)]);
    expect(callback).not.toHaveBeenCalled();
    expect(observer?.observed.has(element)).toBe(false);
  });
});
