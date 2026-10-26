const KEY = 'TRAKT_CLIENT_ID=';
// The byte order mark Windows tools put at a file's start.
const BOM = String.fromCharCode(0xfeff);

/** `env` (a `.env` file's text) with its one `TRAKT_CLIENT_ID` line set to `id`, every other line kept. */
export function withClientId(env: string, id: string): string {
  const lines = (env.startsWith(BOM) ? env.slice(1) : env).split(/\r?\n/).filter((line) => !line.startsWith(KEY));
  const kept = lines.join('\n').trimEnd();
  return `${kept ? `${kept}\n` : ''}${KEY}${id}\n`;
}
