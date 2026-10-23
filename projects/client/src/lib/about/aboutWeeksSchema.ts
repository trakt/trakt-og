import { z } from 'zod/v4';

/** The `weeks` key in the `ABOUT` KV namespace: every stored week's Monday, newest first. */
export const aboutWeeksSchema = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
