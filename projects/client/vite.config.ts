import adapter from '@sveltejs/adapter-cloudflare';
import type { Adapter } from '@sveltejs/kit';
import { sveltekit } from '@sveltejs/kit/vite';
import { Features } from 'lightningcss';
import { appendFile } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Cloudflare needs a Durable Object's class exported from the worker's own module, and SvelteKit's adapter only
// exports the request handler. Wrangler bundles the class when it deploys.
const withWatchingNowLive = (base: Adapter): Adapter => ({
  ...base,
  async adapt(builder) {
    await base.adapt(builder);
    await appendFile(
      '.svelte-kit/cloudflare/_worker.js',
      "\nexport { WatchingNowLive } from '../../src/lib/live/WatchingNowLive.ts';\n",
    );
  },
});

export default defineConfig(({ mode }) => ({
  css: {
    lightningcss: {
      // Its light-dark() fallback swaps in variables that each token resolves once on :root, so a band forced to
      // `color-scheme: dark` kept the light theme's colors in production.
      exclude: Features.LightDark,
    },
  },
  define: {
    // Inlined at build time, like trakt-web. Dev reads `.env.development`, builds and deploys read `.env.production`.
    TRAKT_CLIENT_ID: JSON.stringify(loadEnv(mode, process.cwd(), 'TRAKT_').TRAKT_CLIENT_ID ?? ''),
  },
  optimizeDeps: {
    // Found late, Vite reloads the page mid sign-in and its API reads go out again.
    include: ['@trakt/api'],
  },
  plugins: [
    {
      name: 'zod-openapi-shim',
      enforce: 'pre',
      // The real package's CommonJS build bundles a second copy of zod into the browser. The server keeps it.
      resolveId(source, _importer, options) {
        if (source !== '@anatine/zod-openapi' || options.ssr) return null;
        return fileURLToPath(new URL('./src/lib/zodOpenApiShim.ts', import.meta.url));
      },
    },
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
      },
      adapter: withWatchingNowLive(adapter()),
    }),
  ],
  test: {
    alias: { 'cloudflare:workers': fileURLToPath(new URL('./src/test/cloudflareWorkers.ts', import.meta.url)) },
    passWithNoTests: true,
    setupFiles: ['src/test/memoryStorage.ts'],
    projects: [
      {
        extends: true,
        test: { name: 'node', include: ['src/**/*.spec.ts', 'scripts/**/*.spec.ts'], exclude: ['**/*.dom.spec.ts'] },
      },
      // Mounts components in a DOM, where only Svelte's browser build runs: keyed each blocks check their keys there.
      {
        extends: true,
        resolve: { conditions: ['browser'] },
        test: { name: 'dom', include: ['src/**/*.dom.spec.ts'], environment: 'happy-dom' },
      },
    ],
  },
}));
