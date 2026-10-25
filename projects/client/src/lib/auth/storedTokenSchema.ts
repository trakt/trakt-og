import { z } from 'zod/v4';

/** The auth cookie's value: the access token and when it expires, in milliseconds. */
export const storedTokenSchema = z.object({ token: z.string().min(1), expiresAt: z.number() });
