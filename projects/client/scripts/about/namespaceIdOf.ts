import { z } from 'zod/v4';

interface NamespaceIdOfParams {
  /** The text of `wrangler.jsonc`. */
  readonly config: string;
  readonly binding: string;
}

const configSchema = z.object({
  kv_namespaces: z.array(z.object({ binding: z.string(), id: z.string() })).default([]),
});

// Drops `//` and `/* */` comments outside strings, so the JSONC parses as JSON.
const stripComments = (jsonc: string) =>
  jsonc.replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_match, string?: string) => string ?? '');

/** The id of a KV namespace binding in `wrangler.jsonc`, or null when it's missing or still a placeholder. */
export function namespaceIdOf({ config, binding }: NamespaceIdOfParams): string | null {
  const parsed = configSchema.safeParse(JSON.parse(stripComments(config).replace(/,(\s*[}\]])/g, '$1')));
  const id = parsed.data?.kv_namespaces.find((namespace) => namespace.binding === binding)?.id;
  return id && /^[0-9a-f]{32}$/.test(id) ? id : null;
}
