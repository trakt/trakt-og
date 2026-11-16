/** One season or episode on the Quality chart. */
export type QualityPoint = {
  /** "Season 3", "E4": for screen readers. */
  readonly label: string;
  /** The axis caption: "S3", "E4". */
  readonly axis: string;
  /** The tooltip's bold name: "Season 3", "8x04". */
  readonly name: string;
  /** An episode's title, after its name in regular weight: "The Last of the Starks". */
  readonly title?: string;
  readonly href: string;
  readonly traktId: number;
  /** The season's or episode's number in its show or season. */
  readonly number: number;
  /** Null under the vote minimum: a gap in the line. */
  readonly percent: number | null;
  readonly votes: number;
};
