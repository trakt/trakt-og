import type { Theme } from './lib/settings/Theme.ts';
import type { loadViewerLists } from './lib/users/loadViewerLists.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  /** The Trakt app's public client ID, inlined by Vite from `TRAKT_CLIENT_ID` at build time. */
  const TRAKT_CLIENT_ID: string;

  namespace App {
    // interface Error {}
    interface Locals {
      /** The access token from the httpOnly auth cookie, set by hooks.server.ts. */
      token: string | null;
      /** One read of the viewer network lists shared by profile and network loaders in this request. */
      viewerLists?: ReturnType<typeof loadViewerLists>;
      /** The viewer's saved theme, set by the root layout's load and written onto `<html>` by hooks.server.ts. */
      theme?: Theme;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        /** `off` in `.dev.vars` opens every page locally. Unset in production, so og.trakt.tv stays admin-only. */
        OG_ADMIN_GATE?: string;
        /** Klipy's API key, a Worker secret. Unset, comments can't pick GIFs. */
        KLIPY_API_KEY?: string;
      };
    }
  }
}

export {};
