import { z } from 'zod/v4';
import { listRowsSchema } from './listRowsSchema.ts';

/** `/users/:id/likes/lists`: each liked list (personal and official mixed) with when it was liked. Parsed, as proxied. */
export const likedListsSchema = z.array(z.object({ liked_at: z.string(), list: listRowsSchema.element }));
