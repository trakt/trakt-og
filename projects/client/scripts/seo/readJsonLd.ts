import type { JsonLd } from './JsonLd.ts';

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nodes = (value: unknown): readonly unknown[] => {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (isRecord(value) && Array.isArray(value['@graph'])) return value['@graph'].flatMap(nodes);
  return [value];
};

const typesOf = (node: unknown): readonly string[] => {
  if (!isRecord(node)) return [];
  const type = node['@type'];
  if (typeof type === 'string') return [type];
  return Array.isArray(type) ? type.filter((entry): entry is string => typeof entry === 'string') : [];
};

const nullPaths = (value: unknown, path: string): readonly string[] => {
  if (value === null) return [path];
  if (Array.isArray(value)) return value.flatMap((entry, index) => nullPaths(entry, `${path}[${index}]`));
  if (isRecord(value)) return Object.entries(value).flatMap(([key, entry]) => nullPaths(entry, `${path}.${key}`));
  return [];
};

const parse = (json: string): { value: unknown } | { error: string } => {
  try {
    return { value: JSON.parse(json) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

/** Parses each JSON-LD script and collects its types and null fields. */
export function readJsonLd(scripts: readonly string[]): JsonLd {
  const parsed = scripts.map(parse);
  const values = parsed.flatMap((result) => ('value' in result ? [result.value] : []));

  return {
    types: values.flatMap(nodes).flatMap(typesOf),
    errors: parsed.flatMap((result) => ('error' in result ? [result.error] : [])),
    nulls: values.flatMap((value) => nullPaths(value, '$')),
  };
}
