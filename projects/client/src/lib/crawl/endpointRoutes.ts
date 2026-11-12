const ROUTES_DIR = '/src/routes';
const ENDPOINT_FILE = '/+server.ts';

/** The route ids of every `+server.ts`, which answer with their own data rather than a page. */
export const ENDPOINT_ROUTES: ReadonlySet<string> = new Set(
  Object.keys(import.meta.glob('/src/routes/**/+server.ts')).map(
    (file) => file.slice(ROUTES_DIR.length, -ENDPOINT_FILE.length) || '/',
  ),
);
