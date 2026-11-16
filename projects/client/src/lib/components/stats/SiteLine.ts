/** Another site's line on the Quality chart: a percent and a vote count per point, in order, null where it has none. */
export type SiteLine = {
  readonly percents: readonly (number | null)[];
  readonly votes: readonly (number | null)[];
};
