import type { detectCrawler } from './lib/crawl/detectCrawler.ts';
import type { Theme } from './lib/settings/Theme.ts';
import type { loadViewerLists } from './lib/users/loadViewerLists.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  /** The Trakt app's public client ID, inlined by Vite from `TRAKT_CLIENT_ID` at build time. */
  const TRAKT_CLIENT_ID: string;

  namespace App {
    interface Error {
      message: string;
      /** The client ID may not call this route: see `lib/api/apiUnavailable.ts`. */
      unavailable?: boolean;
      /** The API answered with a 429: see `lib/api/apiRateLimited.ts`. */
      rateLimited?: boolean;
    }
    interface Locals {
      /** The access token from the httpOnly auth cookie, set by hooks.server.ts. Null once it has expired. */
      token: string | null;
      /** The auth cookie held a token that has expired, which the browser renews. Set by hooks.server.ts. */
      tokenExpired: boolean;
      /** A verified search engine crawler, or any crawler or link-preview bot. Set by hooks.server.ts. */
      crawler: ReturnType<typeof detectCrawler>;
      /** One read of the viewer network lists shared by profile and network loaders in this request. */
      viewerLists?: ReturnType<typeof loadViewerLists>;
      /** The viewer's saved theme, set by the root layout's load and written onto `<html>` by hooks.server.ts. */
      theme?: Theme;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        /** Klipy's API key, a Worker secret. Unset, comments can't pick GIFs. */
        KLIPY_API_KEY?: string;
        /** A read-only GitHub token, a Worker secret, for the about page's GitHub reads. Unset, it reads without one. */
        GITHUB_TOKEN?: string;
      };
    }
  }
}

export {};
