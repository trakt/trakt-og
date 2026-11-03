import type { AnalyticsData } from './AnalyticsData.ts';
import type { AnalyticsEngine } from './AnalyticsEngine.ts';
import { isKnownAnalyticsEvent } from './isKnownAnalyticsEvent.ts';
import { splitEventPayload } from './splitEventPayload.ts';

const HAL_ENDPOINT = 'https://hal.trakt.tv/e';

// HAL refuses a batch over 50 events outright, so chunk rather than trim.
const MAX_EVENTS_PER_BATCH = 50;
const FLUSH_DELAY_MS = 10_000;

type HalEvent = {
  event: string;
  at: number;
  dims: Record<string, string>;
  metrics: Record<string, number>;
};

type SendBatch = (endpoint: string, events: ReadonlyArray<HalEvent>) => void;

function chunk<T>(items: ReadonlyArray<T>, size: number): ReadonlyArray<ReadonlyArray<T>> {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

// `text/plain` keeps the request CORS-simple, so it never preflights. It is also
// the only content type `sendBeacon` can produce without one.
const sendBatch: SendBatch = (endpoint, events) => {
  const body = new Blob([JSON.stringify({ sentAt: Date.now(), events })], {
    type: 'text/plain;charset=UTF-8',
  });

  if (navigator.sendBeacon?.(endpoint, body)) {
    return;
  }

  // Beacon declined to queue (its own ~64KB cap). `keepalive` is the only
  // fallback that outlives page teardown. No credentials: HAL answers
  // `Access-Control-Allow-Origin: *` and must never see a cookie.
  fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => undefined);
};

const logBatch: SendBatch = (endpoint, events) => {
  console.info(`Analytics: would send ${events.length} event(s) to ${endpoint}`, events);
};

type CreateHalEngineProps = {
  isReporting?: boolean;
  send?: SendBatch;
  endpoint?: string;
  // Dims merged into every event, whoever recorded it.
  enrich?: () => AnalyticsData;
};

export function createHalEngine({
  isReporting = false,
  send = isReporting ? sendBatch : logBatch,
  endpoint = `${HAL_ENDPOINT}?trakt-api-key=${TRAKT_CLIENT_ID}`,
  enrich = () => ({}),
}: CreateHalEngineProps = {}): AnalyticsEngine & { destroy: () => void } {
  let buffered: ReadonlyArray<HalEvent> = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let isDestroyed = false;

  const flush = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (buffered.length === 0) return;

    const pending = buffered;
    buffered = [];

    chunk(pending, MAX_EVENTS_PER_BATCH).forEach((batch) => send(endpoint, batch));
  };

  const scheduleFlush = () => {
    if (flushTimer) return;

    flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
  };

  const flushOnHide = () => {
    if (document.visibilityState === 'hidden') flush();
  };

  // `pagehide` and a hidden `visibilitychange` are the only teardown signals
  // mobile Safari fires reliably; `beforeunload`/`unload` are not.
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', flushOnHide);

  return {
    record: (key, data) => {
      if (!isKnownAnalyticsEvent(key)) return;

      // Enriched dims last so an event payload cannot shadow them.
      buffered = [...buffered, { event: key, at: Date.now(), ...splitEventPayload({ ...data, ...enrich() }) }];

      if (isDestroyed || buffered.length >= MAX_EVENTS_PER_BATCH) {
        flush();
        return;
      }

      scheduleFlush();
    },
    // Unlisten first, then flush, so the buffer is not sent twice. A caller
    // can still hold this engine after a remount, so late events go out
    // straight away instead of waiting on listeners that are gone.
    destroy: () => {
      isDestroyed = true;
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushOnHide);
      flush();
    },
  };
}
