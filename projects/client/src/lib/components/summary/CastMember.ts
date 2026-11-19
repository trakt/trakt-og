/**
 * One headshot in a summary's actors strip. It's page data, sent once per person (a long-running show has thousands),
 * so it keeps ids and numbers: the strip builds the link, the headshot and the episodes label.
 */
export interface CastMember {
  readonly name: string;
  readonly slug: string;
  /** The person's Trakt id, for the headshot. */
  readonly id: number;
  /** Every character, joined: "Tyler Durden / Narrator". */
  readonly characters: string;
  /** Picks the silhouette when there's no headshot: "female", "male", "non_binary" or "unknown". */
  readonly gender?: string;
  /** Shows: how many episodes. 0 (a movie, or a viewer who hides actor spoilers) gets no episodes line. */
  readonly episodes: number;
}
