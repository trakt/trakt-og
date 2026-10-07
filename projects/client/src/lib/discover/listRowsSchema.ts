import { z } from 'zod/v4';
import { listSchema } from './listSchema.ts';

/** `/lists/trending` rows: the list, and its likes this week (`like_count`; the list's own `likes` is all time). */
export const listRowsSchema = z.array(z.object({ like_count: z.number().nullish(), list: listSchema }));
