import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { holdHover } from './holdHover.ts';

describe('holdHover', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = () => {
    const node = new EventTarget() as unknown as HTMLElement;
    const onhold = vi.fn();
    const detach = holdHover(2000, onhold)(node);
    return { node, onhold, detach };
  };

  it('should fire once the pointer rests long enough', () => {
    const { node, onhold } = setup();
    node.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(2000);
    expect(onhold).toHaveBeenCalledOnce();
  });

  it('should not fire when the pointer leaves first', () => {
    const { node, onhold } = setup();
    node.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(1500);
    node.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(1000);
    expect(onhold).not.toHaveBeenCalled();
  });

  it('should stop listening once detached', () => {
    const { node, onhold, detach } = setup();
    if (typeof detach === 'function') detach();
    node.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(2000);
    expect(onhold).not.toHaveBeenCalled();
  });
});
