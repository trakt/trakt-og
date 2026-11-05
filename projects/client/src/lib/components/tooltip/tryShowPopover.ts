type ShowPopover = (options: { source: HTMLElement }) => void;

/**
 * Shows a popover from its trigger. False when the browser refuses because another popover is mid show or hide: focus
 * coming back to a trigger as the popover it opened closes.
 */
export function tryShowPopover(popover: { showPopover: ShowPopover }, source: HTMLElement): boolean {
  try {
    popover.showPopover({ source });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'InvalidStateError') return false;
    throw error;
  }
}
