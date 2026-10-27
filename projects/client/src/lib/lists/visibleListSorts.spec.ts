import { describe, expect, it } from 'vitest';
import { visibleListSorts } from './visibleListSorts.ts';

const bys = (...args: Parameters<typeof visibleListSorts>) => visibleListSorts(...args).map(({ by }) => by);

describe('visibleListSorts', () => {
  it('should hide your data from a signed-out viewer', () => {
    const sorts = bys({ types: [], signedIn: false });
    expect(sorts).toHaveLength(16);
    expect(sorts).toContain('imdb_rating');
    expect(sorts).not.toContain('my_rating');
  });

  it('should show every sort to a signed-in viewer on all types', () => {
    expect(bys({ types: [], signedIn: true })).toHaveLength(19);
  });

  it('should hide sorts that do not apply to the chosen types', () => {
    const shows = bys({ types: ['show'], signedIn: true });
    expect(shows).toContain('rt_tomatometer');
    expect(shows).not.toContain('metascore');
    expect(bys({ types: ['season'], signedIn: true })).not.toContain('imdb_rating');
  });
});
