/** One headshot in a summary's actors strip. */
export interface CastMember {
  readonly name: string;
  readonly href: string;
  /** Every character, joined: "Tyler Durden / Narrator". */
  readonly characters: string;
  readonly image?: string;
  /** Picks the silhouette when there's no headshot: "female", "male", "non_binary" or "unknown". */
  readonly gender?: string;
  /** Shows: "24 episodes", or '' when the viewer hides actor spoilers. Movies leave it out and get no line. */
  readonly episodes?: string;
}
