/** The viewer's own note on an item. */
export type PrivateNote = {
  readonly id: number;
  readonly text: string;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
};
