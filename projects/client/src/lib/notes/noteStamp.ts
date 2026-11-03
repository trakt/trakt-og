import type { PrivateNote } from './PrivateNote.ts';

// Writing a note can stamp its two dates a moment apart.
const SAME_WRITE_MS = 60 * 1000;

/** The one date a note shows: when it was added, or when it was last edited after that. */
export function noteStamp({
  createdAt,
  updatedAt,
}: Pick<PrivateNote, 'createdAt' | 'updatedAt'>): { label: 'Added' | 'Updated'; at: string } | null {
  if (!createdAt) return updatedAt ? { label: 'Updated', at: updatedAt } : null;
  const edited = updatedAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > SAME_WRITE_MS;
  return edited ? { label: 'Updated', at: updatedAt } : { label: 'Added', at: createdAt };
}
