import type { VisibilityTarget } from '../visibility/VisibilityTarget.ts';

/**
 * One row in a quick-icon bar's ••• menu, in the order given. The bar shows the ••• only when it has rows.
 * `progress` and `history` link to the viewer's progress or history narrowed to the title, with a divider after them;
 * `watch-now` moves the bar's Watch Now into the menu (its own icon goes); `rewatch` and `drop` start a rewatch or drop
 * a show through og's prompts, with `onsave` after they go through. New kinds join this union as the menu grows.
 */
export type QuickIconMore =
  | { readonly kind: 'progress' | 'history'; readonly href: string }
  | { readonly kind: 'watch-now' }
  | { readonly kind: 'rewatch' | 'drop'; readonly target: VisibilityTarget; readonly onsave?: () => void };
