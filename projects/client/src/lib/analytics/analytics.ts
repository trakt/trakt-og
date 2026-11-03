import type { AnalyticsData } from './AnalyticsData.ts';
import type { AnalyticsEngine } from './AnalyticsEngine.ts';

let installed: AnalyticsEngine | null = null;

// trakt-web hands its engine down through Svelte context. og's writes live in
// plain modules called from click handlers, where context can't be read, so
// the root layout installs one engine here instead. Until then, and on the
// server, recording does nothing.
export const analytics = {
  install: (engine: AnalyticsEngine) => {
    installed = engine;

    return () => {
      if (installed === engine) installed = null;
    };
  },
  record: (key: string, data: AnalyticsData) => installed?.record(key, data),
};
