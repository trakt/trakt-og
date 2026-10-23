import { describe, expect, it } from 'vitest';
import { namespaceIdOf } from './namespaceIdOf.ts';

const ID = '0123456789abcdef0123456789abcdef';

const config = (id: string) =>
  `{
  "$schema": "./node_modules/wrangler/config-schema.json",
  // Served on a custom domain. "quotes // in comments" are fine.
  "routes": [{ "pattern": "og.example.com/*", "custom_domain": true }],
  /* The about page's data. */
  "kv_namespaces": [{ "binding": "OTHER", "id": "ffffffffffffffffffffffffffffffff" }, { "binding": "ABOUT", "id": "${id}" },],
}`;

describe('util: namespaceIdOf', () => {
  it('should read the binding id from JSONC with comments and trailing commas', () => {
    expect(namespaceIdOf({ config: config(ID), binding: 'ABOUT' })).toBe(ID);
  });

  it('should keep slashes inside strings', () => {
    expect(namespaceIdOf({ config: config(ID), binding: 'OTHER' })).toBe('ffffffffffffffffffffffffffffffff');
  });

  it('should treat a placeholder id as missing', () => {
    expect(namespaceIdOf({ config: config('REPLACE_WITH_THE_ABOUT_NAMESPACE_ID'), binding: 'ABOUT' })).toBeNull();
  });

  it('should return null when the binding is missing', () => {
    expect(namespaceIdOf({ config: config(ID), binding: 'NOPE' })).toBeNull();
    expect(namespaceIdOf({ config: '{}', binding: 'ABOUT' })).toBeNull();
  });
});
