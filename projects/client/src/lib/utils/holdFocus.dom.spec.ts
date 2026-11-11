import { afterEach, describe, expect, it } from 'vitest';
import { holdFocus } from './holdFocus.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function setup() {
  document.body.innerHTML = `
    <main id="content" tabindex="-1">
      <div data-refocus>
        <div class="watching"><button type="button" class="cancel">Cancel</button></div>
        <button type="button" class="help">Help</button>
      </div>
      <div class="bar"><button type="button" class="bar-cancel">Cancel</button></div>
    </main>`;
  const find = (selector: string) => document.querySelector<HTMLElement>(selector) ?? document.body;
  return { find };
}

describe('util: holdFocus', () => {
  it('should focus the first control left in the refocus host once the focused control goes', async () => {
    const { find } = setup();
    find('.cancel').focus();

    const refocus = holdFocus(find('.watching'));
    find('.watching').remove();
    await refocus();

    expect(document.activeElement).toBe(find('.help'));
  });

  it('should fall back to the main content outside a refocus host', async () => {
    const { find } = setup();
    find('.bar-cancel').focus();

    const refocus = holdFocus(find('.bar'));
    find('.bar').remove();
    await refocus();

    expect(document.activeElement).toBe(find('#content'));
  });

  it('should leave focus alone when the node stays', async () => {
    const { find } = setup();
    find('.cancel').focus();

    const refocus = holdFocus(find('.watching'));
    await refocus();

    expect(document.activeElement).toBe(find('.cancel'));
  });

  it('should leave focus alone when it was elsewhere', async () => {
    const { find } = setup();
    find('.help').focus();

    const refocus = holdFocus(find('.watching'));
    find('.watching').remove();
    await refocus();

    expect(document.activeElement).toBe(find('.help'));
  });
});
