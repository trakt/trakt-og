/** A count with its word: "15,212" "episodes". */
export type PanelCount = { readonly text: string; readonly word: string };

/** One unit of a watch time: 512 "d", 6 "h", 14 "m". */
export type TimePart = { readonly value: string; readonly unit: string };

export type PanelTime = {
  readonly parts: readonly TimePart[];
  /** "512 days, 6 hours, 14 mins", for screen readers. */
  readonly spoken: string;
};

export type StatsPanel = {
  /** Total time in its largest readable unit: "1.8" "years", or days, or hours, with the plays. */
  readonly allTime: {
    readonly value: string;
    readonly unit: string;
    readonly spoken: string;
    readonly plays: PanelCount;
  };
  /** Null when the stats came without `progress`. */
  readonly finished: {
    readonly finished: string;
    /** "of 642": the shows watched. */
    readonly watched: string;
    readonly started: PanelCount;
    readonly dropped: PanelCount;
    /** Finished, in progress and dropped as shares of the three, 0 to 100. Null when there are none. */
    readonly meter: { readonly finished: number; readonly started: number; readonly dropped: number } | null;
  } | null;
  readonly shows: {
    readonly time: PanelTime;
    readonly plays: PanelCount;
    readonly episodes: PanelCount;
    readonly shows: PanelCount;
  };
  readonly movies: { readonly time: PanelTime; readonly plays: PanelCount; readonly movies: PanelCount };
};
