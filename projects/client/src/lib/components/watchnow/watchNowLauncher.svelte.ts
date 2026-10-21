/** What a Watch Now button outside the sidebar opens: the item's API path and the dialog's header. */
export type WatchNowLaunch = {
  readonly path: string;
  readonly title: string;
  readonly year?: number | null;
  readonly fanart?: string;
};

/** The one Watch Now dialog the layout's WatchNowHost shows, for quick icons anywhere on the page. */
export const watchNowLauncher = $state<{ open: boolean; item?: WatchNowLaunch }>({ open: false });

export function openWatchNow(item: WatchNowLaunch) {
  watchNowLauncher.item = item;
  watchNowLauncher.open = true;
}
