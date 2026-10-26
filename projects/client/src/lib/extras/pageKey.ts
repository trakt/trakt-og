/**
 * The key a plain keystroke on the page typed, or null while you type in a field, hold a modifier, or something else
 * already handled it.
 */
export function pageKey(event: KeyboardEvent): string | null {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return null;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')) {
    return null;
  }
  return event.key;
}
