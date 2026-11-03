import { describe, expect, it } from 'vitest';
import {
  parseSavedCalendarFilters,
  savedCalendarFilterHref,
  savedCalendarFilterId,
  savedCalendarFilterLabel,
  readSavedCalendarFilters,
  SAVED_CALENDAR_FILTERS_KEY,
  savedCalendarFilterPath,
  withoutSavedCalendarFilter,
  withSavedCalendarFilter,
  writeSavedCalendarFilters,
} from './savedCalendarFilters.ts';

const japanese = { name: 'Japanese premieres', path: '/calendars/premieres', query: 'languages=ja' };
const dramas = { name: 'Dramas', path: '/calendars/my/shows', query: 'genres=drama' };

describe('parseSavedCalendarFilters', () => {
  it('should read the saved filters back from the cookie', () => {
    expect(parseSavedCalendarFilters(JSON.stringify([japanese, dramas]))).toEqual([japanese, dramas]);
  });

  it('should have none when the cookie is missing, broken or points off the calendars', () => {
    expect(parseSavedCalendarFilters(null)).toEqual([]);
    expect(parseSavedCalendarFilters('{nope')).toEqual([]);
    expect(parseSavedCalendarFilters(JSON.stringify([{ ...japanese, path: 'https://example.com' }]))).toEqual([]);
    expect(parseSavedCalendarFilters(JSON.stringify([{ ...japanese, name: ' ' }]))).toEqual([]);
  });
});

describe('withSavedCalendarFilter', () => {
  it('should add a new filter at the end', () => {
    expect(withSavedCalendarFilter([japanese], dramas)).toEqual([japanese, dramas]);
  });

  it('should replace a filter saved under the same name, in its place', () => {
    const renamed = { ...dramas, name: ' japanese PREMIERES', query: 'languages=ja&genres=anime' };
    expect(withSavedCalendarFilter([japanese, dramas], renamed)).toEqual([renamed, dramas]);
  });
});

describe('withoutSavedCalendarFilter', () => {
  it('should drop the filter by its name', () => {
    expect(withoutSavedCalendarFilter([japanese, dramas], 'Dramas')).toEqual([japanese]);
  });
});

describe('readSavedCalendarFilters and writeSavedCalendarFilters', () => {
  const memory = () => {
    const items = new Map<string, string>();
    return {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
      items,
    };
  };

  it('should round trip the filters through storage', () => {
    const storage = memory();
    expect(writeSavedCalendarFilters(() => storage, [japanese, dramas])).toBe(true);
    expect(readSavedCalendarFilters(() => storage)).toEqual([japanese, dramas]);
  });

  it('should clear the key when the last filter goes', () => {
    const storage = memory();
    writeSavedCalendarFilters(() => storage, [japanese]);
    writeSavedCalendarFilters(() => storage, []);
    expect(storage.items.has(SAVED_CALENDAR_FILTERS_KEY)).toBe(false);
  });

  it('should read none and fail the write when the browser blocks storage', () => {
    const blocked = () => {
      throw new DOMException('Blocked', 'SecurityError');
    };
    expect(readSavedCalendarFilters(blocked)).toEqual([]);
    expect(writeSavedCalendarFilters(blocked, [japanese])).toBe(false);
  });
});

describe('savedCalendarFilterPath', () => {
  it("should leave out the month, so a filter opens on today's", () => {
    expect(savedCalendarFilterPath({ target: 'all', slug: 'premieres' })).toBe('/calendars/premieres');
    expect(savedCalendarFilterPath({ target: 'my', slug: 'shows' })).toBe('/calendars/my/shows');
  });
});

describe('savedCalendarFilterId', () => {
  it('should give a name the same short id however it is cased or spaced', () => {
    expect(savedCalendarFilterId('Japanese premieres')).toMatch(/^[a-z0-9]{1,7}$/);
    expect(savedCalendarFilterId(' japanese PREMIERES ')).toBe(savedCalendarFilterId('Japanese premieres'));
    expect(savedCalendarFilterId('Dramas')).not.toBe(savedCalendarFilterId('Japanese premieres'));
  });
});

describe('savedCalendarFilterHref', () => {
  it('should open the filters with the saved filter named', () => {
    const id = savedCalendarFilterId(japanese.name);
    expect(savedCalendarFilterHref(japanese)).toBe(`/calendars/premieres?languages=ja&saved=${id}`);
    expect(savedCalendarFilterHref({ ...japanese, query: '' })).toBe(`/calendars/premieres?saved=${id}`);
  });
});

describe('savedCalendarFilterLabel', () => {
  it('should name the calendar a filter opens', () => {
    expect(savedCalendarFilterLabel('/calendars/premieres')).toBe('Premieres');
    expect(savedCalendarFilterLabel('/calendars/my/new-shows')).toBe('My New Shows');
    expect(savedCalendarFilterLabel('/calendars/gone')).toBeUndefined();
  });
});
