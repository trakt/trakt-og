import { describe, expect, it } from 'vitest';
import { tryShowPopover } from './tryShowPopover.ts';

const source = {} as HTMLElement;

describe('tryShowPopover', () => {
  it('should show the popover from its trigger', () => {
    const shown: unknown[] = [];
    expect(tryShowPopover({ showPopover: (options) => shown.push(options) }, source)).toBe(true);
    expect(shown).toEqual([{ source }]);
  });

  it('should report a popover the browser refused mid another one closing', () => {
    const showPopover = () => {
      throw new DOMException('Invalid to show a popover during another show operation', 'InvalidStateError');
    };
    expect(tryShowPopover({ showPopover }, source)).toBe(false);
  });

  it('should still throw anything else', () => {
    const showPopover = () => {
      throw new TypeError('not a popover');
    };
    expect(() => tryShowPopover({ showPopover }, source)).toThrow(TypeError);
  });
});
