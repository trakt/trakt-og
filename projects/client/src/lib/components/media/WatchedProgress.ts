/**
 * A show's progress, for its tooltip: "3% watched", then "1 / 32 eps — 1 play (49m)" over a bar. The library tooltip
 * uses it too, "84% in library" over "27 / 32 eps".
 */
export type WatchedProgress = Readonly<{
  verb: 'watched' | 'rewatched' | 'in library';
  /** 0 to 100. */
  percent: number;
  completed: number;
  aired: number;
  /** Left out when unknown, which drops the plays. */
  plays?: number;
  /** The plays' total time, when the runtime is known. */
  minutes?: number;
  /** The library's media servers, "Plex": "27 / 32 eps — from Plex". */
  from?: string;
}>;
