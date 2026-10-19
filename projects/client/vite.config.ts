import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import process from 'node:process';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  define: {
    // Inlined at build time, like trakt-web. Dev reads `.env.development`, builds and deploys read `.env.production`.
    TRAKT_CLIENT_ID: JSON.stringify(loadEnv(mode, process.cwd(), 'TRAKT_').TRAKT_CLIENT_ID ?? ''),
  },
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
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
