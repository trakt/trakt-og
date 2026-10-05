export type GenrePulseView = {
  /** "3.1×". */
  readonly spike: string;
  readonly genre: string;
  /** The month's top genres, with their share now and all time, both 0 to 100. */
  readonly rows: readonly { readonly name: string; readonly now: number; readonly usual: number }[];
};
