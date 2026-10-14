/** The save shortcut's modifier as the keyboard labels it: ⌘ on Apple devices, Ctrl everywhere else. */
export function modifierKey(platform: string): '⌘' | 'Ctrl' {
  return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘' : 'Ctrl';
}
