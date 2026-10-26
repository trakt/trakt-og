/** A movie's or episode's plays, for its watched tooltip: "3 plays" over "6h 30m". */
export type WatchedPlays = Readonly<{
  count: number;
  /** Their total time, when the runtime is known. */
  minutes?: number;
}>;
