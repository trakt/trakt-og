type Click = Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>;

/** Whether a link click belongs to the browser: another button, or a modifier for a new tab or window. */
export function opensElsewhere(click: Click): boolean {
  return click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey;
}
