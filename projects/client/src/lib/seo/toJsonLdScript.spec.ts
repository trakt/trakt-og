import { describe, expect, it } from 'vitest';
import { toJsonLdScript } from './toJsonLdScript.ts';

describe('seo: toJsonLdScript', () => {
  it('should write the data as a JSON-LD script', () => {
    expect(toJsonLdScript({ '@type': 'Movie', name: 'Inception' })).toBe(
      '<script type="application/ld+json">{"@type":"Movie","name":"Inception"}</script>',
    );
  });

  it('should never let the text close the tag, and still parse back', () => {
    const data = { name: '</script><script>alert(1)</script> & <!--', note: 'a\u2028b' };
    const script = toJsonLdScript(data);
    const body = script.slice('<script type="application/ld+json">'.length, -'</script>'.length);

    expect(body).not.toMatch(/[<>&\u2028]/);
    expect(JSON.parse(body)).toEqual(data);
  });
});
