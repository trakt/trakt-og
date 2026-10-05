import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { topListBox } from './topListBox.ts';

const { lena, dex, maya } = boxPersonas;

describe('topListBox', () => {
  it('should show likes across the lists and the most liked one', async () => {
    const { score, entry } = await topListBox.evaluate(lena.input, lena.extras());
    expect(score).toBe(99);
    expect(entry?.view).toMatchObject({
      likes: '1,840',
      lists: '23 lists',
      title: { text: '80s Horror Essentials', href: '/users/lena/lists/80s-horror-essentials' },
      line: '1,204 likes · 87 items · 64 comments',
    });
    expect(entry?.view.posters).toHaveLength(3);
  });

  it('should score a small, quiet curator low', async () => {
    expect((await topListBox.evaluate(dex.input, dex.extras())).score).toBe(21);
  });

  it('should not ask for the lists of someone without any', async () => {
    expect(await topListBox.evaluate(maya.input, () => Promise.reject(new Error('fetched')))).toMatchObject({
      score: null,
      entry: null,
    });
  });
});
