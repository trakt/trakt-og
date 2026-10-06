import { afterEach, describe, expect, it } from 'vitest';
import { newComment } from './newComment.svelte.ts';

const cleanups: (() => void)[] = [];
const mount = () => cleanups.push(newComment.mount());
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe('state: newComment', () => {
  it('should keep the form hidden until an Add comment button opens it', () => {
    mount();

    expect(newComment.available).toBe(true);
    expect(newComment.visible).toBe(false);
  });

  it('should show the form and remember the button that opened it', () => {
    mount();
    const button = { id: 'add-comment' } as HTMLElement;

    newComment.open(button);

    expect(newComment.visible).toBe(true);
    expect(newComment.opener).toBe(button);
    expect(newComment.opened).toBe(1);
  });

  it('should count each click, so an open form scrolls into view again', () => {
    mount();

    newComment.open();
    newComment.open();

    expect(newComment.visible).toBe(true);
    expect(newComment.opened).toBe(2);
  });

  it('should hide the form when it closes, after posting or cancelling', () => {
    mount();
    newComment.open();

    newComment.close();

    expect(newComment.visible).toBe(false);
  });

  it("should forget the page's state when the form unmounts", () => {
    mount();
    newComment.open({ id: 'add-comment' } as HTMLElement);
    cleanups.splice(0).forEach((cleanup) => cleanup());

    expect(newComment.available).toBe(false);
    expect(newComment.visible).toBe(false);
    expect(newComment.opened).toBe(0);
    expect(newComment.opener).toBeUndefined();
    expect(newComment.posted).toEqual([]);
  });
});
