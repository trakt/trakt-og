declare module 'cloudflare:workers' {
  export const env: {
    /** Klipy's API key, a Worker secret. Unset, comments can't pick GIFs. */
    KLIPY_API_KEY?: string;
    /** A read-only GitHub token, a Worker secret, for the about page's GitHub reads. Unset, it reads without one. */
    GITHUB_TOKEN?: string;
  };
  export function waitUntil(promise: Promise<unknown>): void;
}

interface CacheStorage {
  /** The data center's cache. */
  readonly default: import('./lib/settings/keptSettingsFetch.ts').ResponseCache;
}
