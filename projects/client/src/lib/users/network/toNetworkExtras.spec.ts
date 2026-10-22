import { describe, expect, it } from 'vitest';
import { toNetworkExtras } from './toNetworkExtras.ts';

describe('toNetworkExtras', () => {
  it('should key each card by slug with its veteran title and follow date', () => {
    const extras = toNetworkExtras([
      { slug: 'sean', row: { followed_at: '2010-10-29T06:30:01.000Z', user: { vip_veteran_title: 'legend' } } },
    ]);

    expect(extras).toEqual({ sean: { veteran: 'Legend', since: '2010-10-29T06:30:01.000Z' } });
  });

  it('should leave both out when the row has neither', () => {
    const extras = toNetworkExtras([{ slug: 'neil', row: { user: { vip_veteran_title: '  ' } } }]);

    expect(extras).toEqual({ neil: { veteran: null, since: null } });
  });
});
