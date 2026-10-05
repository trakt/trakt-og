/** The keypress fields the header search's `/` shortcut reads. `editing` is true when the target takes text input. */
export interface SearchShortcutKey {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly defaultPrevented: boolean;
  readonly editing: boolean;
}

/** True for a bare `/` that nothing else claimed, pressed outside a text field: the global shortcut to the search. */
export function isSearchShortcut({ key, ctrlKey, metaKey, altKey, defaultPrevented, editing }: SearchShortcutKey) {
  if (key !== '/') return false;
  if (ctrlKey || metaKey || altKey) return false;
  if (defaultPrevented) return false;
  return !editing;
}
