export type BiggestBingeView = {
  readonly episodes: number;
  readonly show: { readonly text: string; readonly href: string };
  /** "Sat, Sep 26", the UTC day. */
  readonly day: string;
};
