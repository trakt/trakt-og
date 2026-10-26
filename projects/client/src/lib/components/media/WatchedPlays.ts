/** A movie's or episode's plays, for its watched tooltip: "Last watched on Oct 12, 2026" over "3 plays (6h 30m)". */
export type WatchedPlays = Readonly<{
  count: number;
  /** Their total time, when the runtime is known. */
  minutes?: number;
  /** The last play as a date, unless OG doesn't know it. */
  at?: string;
}>;
