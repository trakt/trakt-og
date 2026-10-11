import { z } from 'zod/v4';
import type { DarkKnight } from './DarkKnight.ts';

// API sends `dark_knight.to_s`, so an unset value is an empty string.
const schema = z.object({
  browsing: z.object({ dark_knight: z.enum(['false', 'true', 'auto']).catch('true') }).nullish(),
});

/**
 * The viewer's Dark Knight setting from the layout's `/users/settings`. og is dark by default: signed out, unset or
 * anything unexpected is On, and only an explicit Off (or Auto) changes it.
 */
export function toDarkKnight(settings: unknown): DarkKnight {
  const parsed = schema.safeParse(settings);
  if (!parsed.success) return 'true';
  return parsed.data.browsing?.dark_knight ?? 'true';
}
