let closed = $state<boolean | null>(null);

/**
 * Whether the member closed the welcome wall, shared on the page so the getting-started book offers it back the
 * moment it's skipped. Until either sets it, it reads the saved dashboard choice they pass in.
 */
export const wallClosed = {
  value(saved: boolean): boolean {
    return closed ?? saved;
  },
  set(next: boolean) {
    closed = next;
  },
};
