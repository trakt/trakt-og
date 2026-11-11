import { homeLiveSchema } from '#lib/home/live/homeLiveSchema.ts';
import type { HomeLive } from '#lib/home/live/toHomeLive.ts';
import { z } from 'zod/v4';
import { liveSocketPath } from './liveSocketPath.ts';

const messageSchema = z.object({ live: homeLiveSchema });

/** First wait before trying again, doubling to the most. */
const RETRY_MS = 2000;
const MOST_RETRY_MS = 60_000;

const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export type LiveSocketStatus = 'connecting' | 'live' | 'offline';

/**
 * The live page's socket to the refresher: the latest count and when it came. It connects while the tab is visible
 * and closes while it's hidden, so a tab in the background doesn't keep the refresher reading the API. A drop tries
 * again after 2 seconds, doubling to a minute; a refused socket just keeps trying quietly and the page stays on its
 * snapshot. The page only opens it for a VIP.
 */
export function createLiveSocket() {
  let live = $state.raw<HomeLive | null>(null);
  let status = $state<LiveSocketStatus>('connecting');
  let at = $state<number | null>(null);

  /** Opens the socket and keeps it open while the tab is visible; returns the cleanup for an `$effect`. */
  function connect(): () => void {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let wait = RETRY_MS;
    let stopped = false;

    const open = () => {
      if (stopped || socket || document.hidden) return;
      status = 'connecting';
      const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const next = new WebSocket(`${scheme}//${location.host}${liveSocketPath}`);
      socket = next;
      next.onmessage = ({ data }) => {
        const parsed = typeof data === 'string' ? messageSchema.safeParse(readJson(data)) : null;
        if (!parsed?.success) return;
        live = parsed.data.live;
        at = Date.now();
        status = 'live';
        wait = RETRY_MS;
      };
      next.onclose = () => {
        if (socket !== next) return;
        socket = null;
        status = 'offline';
        if (stopped || document.hidden) return;
        retry = setTimeout(open, wait);
        wait = Math.min(wait * 2, MOST_RETRY_MS);
      };
    };
    const close = () => {
      clearTimeout(retry);
      const current = socket;
      socket = null;
      current?.close();
    };
    const visibility = () => (document.hidden ? close() : open());

    document.addEventListener('visibilitychange', visibility);
    open();
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', visibility);
      close();
    };
  }

  return {
    get live() {
      return live;
    },
    get status() {
      return status;
    },
    get at() {
      return at;
    },
    connect,
  };
}
