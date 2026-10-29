import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { Features } from 'lightningcss';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

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
      adapter: adapter(),
    }),
  ],
  test: {
    include: ['src/**/*.spec.ts', 'scripts/**/*.spec.ts'],
    passWithNoTests: true,
    setupFiles: ['src/test/memoryStorage.ts'],
  },
}));
