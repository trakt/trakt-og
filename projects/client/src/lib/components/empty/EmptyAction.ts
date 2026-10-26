/** An empty state's one way out: a link to where to start or a wider view, or a button that clears what hid it. */
export type EmptyAction =
  | { readonly href: string; readonly text: string }
  | { readonly onclick: () => void; readonly text: string; readonly busy?: boolean };
