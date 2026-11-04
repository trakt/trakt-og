import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { longPress } from './longPress.ts';

function setup({ holds = true, slow = false } = {}) {
  let open = false;
  let expanded = false;
  const prompt = {
    matches: (selector: string) => selector === ':popover-open' && open,
    showPopover: vi.fn(() => {
      open = true;
    }),
  };
  const show = () => {
    open = true;
    expanded = true;
  };
  const onhold = vi.fn(slow ? () => {} : show);
  const onclick = vi.fn(show);
  const press = longPress({
    expanded: () => expanded,
    popover: () => prompt as unknown as HTMLElement,
    onhold,
    onclick,
    holds: () => holds,
  });
  return {
    press,
    prompt,
    onhold,
    onclick,
    isOpen: () => open,
    lightDismiss: () => (open = false),
    closed: () => (expanded = false),
  };
}

describe('util: longPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('should open with a click on a short press', () => {
    const { press, onhold, onclick } = setup();
    press.down({ button: 0 });
    vi.advanceTimersByTime(200);
    press.release();
    press.click();
    expect(onclick).toHaveBeenCalledOnce();
    expect(onhold).not.toHaveBeenCalled();
  });

  it('should open with a hold while the button is still down', () => {
    const { press, onhold, onclick } = setup();
    press.down({ button: 0 });
    vi.advanceTimersByTime(500);
    expect(onhold).toHaveBeenCalledOnce();
    press.release();
    press.click();
    expect(onclick).not.toHaveBeenCalled();
  });

  it('should keep the prompt open when letting go of a hold light dismisses it', () => {
    const { press, prompt, isOpen, lightDismiss } = setup();
    press.down({ button: 0 });
    vi.advanceTimersByTime(500);
    press.release();
    lightDismiss();
    press.click();
    expect(prompt.showPopover).toHaveBeenCalledOnce();
    expect(isOpen()).toBe(true);
  });

  it('should not show the prompt when the hold has not opened it yet', () => {
    const { press, prompt, onclick } = setup({ slow: true });
    press.down({ button: 0 });
    vi.advanceTimersByTime(500);
    press.release();
    press.click();
    expect(prompt.showPopover).not.toHaveBeenCalled();
    expect(onclick).not.toHaveBeenCalled();
  });

  it('should only close the prompt when the press starts with it open', () => {
    const { press, onhold, onclick, isOpen, lightDismiss } = setup();
    press.down({ button: 0 });
    press.click();
    onclick.mockClear();
    press.down({ button: 0 });
    vi.advanceTimersByTime(500);
    press.release();
    lightDismiss();
    press.click();
    expect(onhold).not.toHaveBeenCalled();
    expect(onclick).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });

  it('should open again with the next click once closed', () => {
    const { press, onclick, closed } = setup();
    press.down({ button: 0 });
    press.click();
    closed();
    onclick.mockClear();
    press.down({ button: 0 });
    press.click();
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('should ignore presses with other buttons', () => {
    const { press, onhold } = setup();
    press.down({ button: 2 });
    vi.advanceTimersByTime(500);
    expect(onhold).not.toHaveBeenCalled();
  });

  it('should not hold when holding is off', () => {
    const { press, onhold, onclick } = setup({ holds: false });
    press.down({ button: 0 });
    vi.advanceTimersByTime(500);
    press.click();
    expect(onhold).not.toHaveBeenCalled();
    expect(onclick).toHaveBeenCalledOnce();
  });

  it('should cancel the hold when the pointer leaves first', () => {
    const { press, onhold } = setup();
    press.down({ button: 0 });
    vi.advanceTimersByTime(300);
    press.release();
    vi.advanceTimersByTime(500);
    expect(onhold).not.toHaveBeenCalled();
  });
});
