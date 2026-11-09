/** An official franchise collection and the movies on it. */
export type Franchise = {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly movieIds: readonly number[];
  /** The list's likes, which pick the one to keep among collections that hold the same movies. */
  readonly likeCount: number;
};
