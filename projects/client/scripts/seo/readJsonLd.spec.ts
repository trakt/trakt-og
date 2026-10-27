import { describe, expect, it } from 'vitest';
import { readJsonLd } from './readJsonLd.ts';

describe('readJsonLd', () => {
  it('should collect top-level types from objects, arrays and graphs', () => {
    const scripts = [
      '{"@type":"Movie","name":"Inception"}',
      '[{"@type":"BreadcrumbList"},{"@type":["Organization","Brand"]}]',
      '{"@context":"https://schema.org","@graph":[{"@type":"WebSite"}]}',
    ];

    expect(readJsonLd(scripts).types).toEqual(['Movie', 'BreadcrumbList', 'Organization', 'Brand', 'WebSite']);
  });

  it('should not count nested types like partOfSeries', () => {
    const scripts = ['{"@type":"TVEpisode","partOfSeries":{"@type":"TVSeries"}}'];

    expect(readJsonLd(scripts).types).toEqual(['TVEpisode']);
  });

  it('should report a script that is not valid JSON', () => {
    const { types, errors } = readJsonLd(['{"@type":"Movie",}', '{"@type":"Person"}']);

    expect(types).toEqual(['Person']);
    expect(errors).toHaveLength(1);
  });

  it('should list fields sent as null', () => {
    const scripts = ['{"@type":"Movie","duration":null,"genre":["Action",null]}'];

    expect(readJsonLd(scripts).nulls).toEqual(['$.duration', '$.genre[1]']);
  });
});
