import type { JsonLd } from './JsonLd.ts';

/** The object without its null, undefined, empty-string and empty-array fields, which structured data leaves out. */
export function compact(record: Readonly<Record<string, unknown>>): JsonLd {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length),
    ),
  );
}
