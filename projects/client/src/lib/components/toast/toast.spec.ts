import { describe, expect, it } from 'vitest';
import { toast } from './toast.svelte.ts';

describe('store: toast', () => {
  it('should put the newest toast first', () => {
    toast.success('Added to your watchlist.');
    toast.error('Something went wrong.');

    expect(toast.list.map(({ type, message }) => [type, message])).toEqual([
      ['error', 'Something went wrong.'],
      ['success', 'Added to your watchlist.'],
    ]);
  });

  it('should keep a toast action for its button', () => {
    const run = () => {};
    toast.success('You hid Season 3 of Dexter.', { label: 'Undo', run });

    expect(toast.list[0]).toMatchObject({ message: 'You hid Season 3 of Dexter.', action: { label: 'Undo', run } });
    toast.dismiss(toast.list[0]?.id ?? -1);
  });

  it('should dismiss only the toast it is given', () => {
    const [newest, oldest] = toast.list;
    toast.dismiss(newest?.id ?? -1);

    expect(toast.list).toEqual([oldest]);
  });
});
