/** A media item that can carry a private note. */
export type NotableItem = {
  readonly type: 'movie' | 'show' | 'season' | 'episode' | 'person';
  /** Trakt id: the note writes send it. */
  readonly id: number;
  /** Movies and shows: v3 reads their note by it. Seasons and episodes have none. */
  readonly slug?: string;
  readonly title: string;
  readonly year?: number | null;
  readonly fanart?: string;
};
