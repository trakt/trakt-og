import { describe, expect, it } from 'vitest';
import { pickerSections } from './pickerSections.ts';
const list = (id: number, name: string, selected = false, collaboration = false) => ({
  id,
  name,
  selected,
  collaboration,
  rank: 0,
  count: 0,
  privacy: 'public',
  owner: 'me',
});
const ids = (sections: ReturnType<typeof pickerSections>) =>
  Object.fromEntries(sections.map(({ key, ids }) => [key, ids]));
describe('pickerSections', () => {
  it('should put the watchlist and selected lists under Listed on', () => {
    expect(ids(pickerSections([list(1, 'Zebra', true), list(2, 'Apple'), list(3, 'Crew', true, true)], true))).toEqual({
      listed: [0, 3, 1],
      mine: [2],
      shared: [],
    });
  });
  it('should lead Your lists with the watchlist when the item is not on it', () => {
    expect(ids(pickerSections([list(1, 'Zebra'), list(2, 'Apple')], false))).toEqual({
      listed: [],
      mine: [0, 2, 1],
      shared: [],
    });
  });
  it("should keep unselected collaborations apart from the viewer's own lists", () => {
    expect(ids(pickerSections([list(1, 'Mine'), list(2, 'Crew', false, true)], false))).toEqual({
      listed: [],
      mine: [0, 1],
      shared: [2],
    });
  });
});
