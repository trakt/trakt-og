type BoxExtraContext = {
  readonly fetch: typeof fetch;
  /** Only for a private profile the viewer may see. Public reads go without it. */
  readonly token: string | null;
  /** The profile's slug. */
  readonly id: string;
};

type BoxExtra<T> = (context: BoxExtraContext) => Promise<T>;

/**
 * Runs each box's extra request at most once per page load, however many boxes ask for it, and turns a failed one
 * into `undefined` so a box can't fail the page.
 */
export function boxExtraLoader(context: BoxExtraContext) {
  const started = new Map<BoxExtra<unknown>, Promise<unknown>>();

  return <T>(extra: BoxExtra<T>): Promise<T | undefined> => {
    const running = started.get(extra) ?? extra(context).catch(() => undefined);
    started.set(extra, running);
    // The map can't tie each key's type to its value's, but each value came from calling its own key.
    return running as Promise<T | undefined>;
  };
}
