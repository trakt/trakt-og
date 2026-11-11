type Page = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;

type RefreshOnReturnParams = {
  refresh: () => void;
  page?: Page;
  /** How long the tab has to be hidden first, so flicking between tabs doesn't refetch. */
  awayMs?: number;
  now?: () => number;
};

/** Calls `refresh` when the tab shows again after being hidden for at least `awayMs`. Returns the stop function. */
export function refreshOnReturn({
  refresh,
  page = document,
  awayMs = 60_000,
  now = Date.now,
}: RefreshOnReturnParams): () => void {
  let hiddenAt = page.visibilityState === 'visible' ? null : now();

  const change = () => {
    if (page.visibilityState !== 'visible') {
      hiddenAt ??= now();
      return;
    }
    const away = hiddenAt === null ? 0 : now() - hiddenAt;
    hiddenAt = null;
    if (away >= awayMs) refresh();
  };

  page.addEventListener('visibilitychange', change);
  return () => page.removeEventListener('visibilitychange', change);
}
