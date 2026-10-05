/** An item that can be added to a watchlist or personal list. */
export interface ListTarget {
  readonly type: 'movie' | 'show' | 'season' | 'episode';
  readonly id: number;
  readonly title: string;
}
