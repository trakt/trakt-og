import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsEvent } from './AnalyticsEvent.ts';
import { createHalEngine } from './createHalEngine.ts';

const ENDPOINT = 'https://hal.test/e';

// og's specs run in Node: the engine only needs the teardown events.
beforeEach(() => {
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Each engine attaches window listeners, so they have to be disposed between
// tests or a later `pagehide` reaches every engine the file ever created.
let engines: ReadonlyArray<{ destroy: () => void }> = [];

function setup(enrich?: () => Record<string, string | number>) {
  const send = vi.fn();
  const engine = createHalEngine({ endpoint: ENDPOINT, send, enrich });
  engines = [...engines, engine];
  return { engine, send };
}

describe('store: createHalEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    engines.forEach((engine) => engine.destroy());
    engines = [];
    vi.useRealTimers();
  });

  it('should buffer events until the flush delay elapses', () => {
    const { engine, send } = setup();

    engine.record(AnalyticsEvent.Rate, { rating: 8 });
    expect(send).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(send).toHaveBeenCalledTimes(1);
    const [endpoint, batch] = send.mock.calls.at(0) ?? [];
    expect(endpoint).toBe(ENDPOINT);
    expect(batch).toMatchObject([
      {
        event: AnalyticsEvent.Rate,
        dims: {},
        metrics: { rating: 8 },
      },
    ]);
  });

  it('should send an event recorded after destroy right away', () => {
    const { engine, send } = setup();

    engine.destroy();
    engine.record(AnalyticsEvent.Rate, { rating: 8 });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toMatchObject([{ event: AnalyticsEvent.Rate }]);
  });

  it('should drop an event name absent from the allowlist', () => {
    const { engine, send } = setup();

    engine.record('not-a-real-event', { source: 'somewhere' });
    vi.runOnlyPendingTimers();

    expect(send).not.toHaveBeenCalled();
  });

  it('should flush immediately once the batch cap is reached', () => {
    const { engine, send } = setup();

    for (let index = 0; index < 50; index++) {
      engine.record(AnalyticsEvent.Watchlist, { action: 'add' });
    }

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls.at(0)?.[1]).toHaveLength(50);
  });

  it('should chunk a flush of more than the batch cap', () => {
    const { engine, send } = setup();

    for (let index = 0; index < 51; index++) {
      engine.record(AnalyticsEvent.Watchlist, { action: 'add' });
    }
    vi.runOnlyPendingTimers();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.at(0)?.[1]).toHaveLength(50);
    expect(send.mock.calls.at(1)?.[1]).toHaveLength(1);
  });

  it('should flush on page teardown', () => {
    const { engine, send } = setup();

    engine.record(AnalyticsEvent.Theme, { theme: 'dark' });
    window.dispatchEvent(new Event('pagehide'));

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should send the buffer when destroyed', () => {
    const { engine, send } = setup();

    engine.record(AnalyticsEvent.Theme, { theme: 'dark' });
    engine.destroy();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('should stop reacting to page teardown once destroyed', () => {
    const { engine, send } = setup();

    engine.record(AnalyticsEvent.Theme, { theme: 'dark' });
    engine.destroy();
    send.mockClear();

    window.dispatchEvent(new Event('pagehide'));

    expect(send).not.toHaveBeenCalled();
  });

  it('should merge enriched dims into every event', () => {
    const { engine, send } = setup(() => ({ user_type: 'vip' }));

    engine.record(AnalyticsEvent.ExportInitiated, {});
    vi.runOnlyPendingTimers();

    expect(send.mock.calls.at(0)?.[1]?.[0]?.dims).toEqual({ user_type: 'vip' });
  });

  it('should not let an event payload shadow an enriched dim', () => {
    const { engine, send } = setup(() => ({ user_type: 'anonymous' }));

    engine.record(AnalyticsEvent.Theme, { theme: 'dark', user_type: 'vip' });
    vi.runOnlyPendingTimers();

    expect(send.mock.calls.at(0)?.[1]?.[0]?.dims.user_type).toBe('anonymous');
  });

  it('should never emit a user identifier', () => {
    const { engine, send } = setup();

    engine.record(AnalyticsEvent.Rate, { rating: 8, user_type: 'vip' });
    vi.runOnlyPendingTimers();

    const serialized = JSON.stringify(send.mock.calls.at(0)?.[1]);
    expect(serialized).not.toContain('userId');
    expect(serialized).not.toContain('user_joined_at');
    expect(serialized).toContain('vip');
  });
});

describe('store: createHalEngine without reporting', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should only log, never reach the network', () => {
    vi.useFakeTimers();
    const beacon = vi.fn(() => true);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.stubGlobal('navigator', { sendBeacon: beacon });

    const engine = createHalEngine({ isReporting: false });
    engine.record(AnalyticsEvent.Rate, { rating: 8 });
    engine.destroy();

    expect(beacon).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
  });
});
