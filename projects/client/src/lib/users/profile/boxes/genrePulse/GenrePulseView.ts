type GenreShare = {
  readonly slug: string;
  readonly name: string;
  /** Its share of this month's plays and of all time, both 0 to 100. */
  readonly now: number;
  readonly usual: number;
};

export type GenrePulseView = {
  /** How far the hot genre runs above its usual share: "3.1×". */
  readonly spike: string;
  readonly hot: GenreShare;
  /** The month's next biggest genre that's also above its usual share, or `null` with none. */
  readonly alsoUp: GenreShare | null;
};
