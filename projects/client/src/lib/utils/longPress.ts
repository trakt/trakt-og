type Prompt = Pick<HTMLElement, 'matches' | 'showPopover'>;

type LongPressParams = {
  /** Whether the button's prompt is open, as its last `toggle` event left it. */
  readonly expanded: () => boolean;
  readonly popover: () => Prompt | undefined;
  readonly onhold: () => void;
  readonly onclick: () => void;
  /** False skips the hold, leaving a plain click. */
  readonly holds?: () => boolean;
  readonly ms?: number;
};

/**
 * A button that opens its `popover="auto"` prompt on a click, or on a hold. A hold opens the prompt while the button is
 * still down, so letting go there light dismisses it before the `click` arrives; the click shows it again. A press that
 * starts with the prompt open only closes it, the way a click outside does.
 */
export function longPress({ expanded, popover, onhold, onclick, holds = () => true, ms = 500 }: LongPressParams) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let held = false;
  let dismissing = false;

  const release = () => clearTimeout(timer);
  const down = (event: Pick<PointerEvent, 'button'>) => {
    if (event.button !== 0) return;
    release();
    held = false;
    dismissing = expanded();
    if (dismissing || !holds()) return;
    timer = setTimeout(() => {
      held = true;
      onhold();
    }, ms);
  };
  const click = () => {
    release();
    if (dismissing) {
      dismissing = false;
      return;
    }
    if (held) {
      held = false;
      // `expanded` is still true here: the closing toggle event comes later, and showing again cancels it.
      const prompt = popover();
      if (expanded() && !prompt?.matches(':popover-open')) prompt?.showPopover();
      return;
    }
    onclick();
  };
  return { down, release, click };
}
