/**
 * One thing related picks can share with the summary's title: a subgenre (its slug as the id), or its people. A chip
 * in the band's filter and a block in each pick's fingerprint.
 */
export type RelatedThread = {
  readonly id: string;
  readonly label: string;
  /** How many picks share it. */
  readonly count: number;
  readonly people: boolean;
};
