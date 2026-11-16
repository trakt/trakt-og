import { z } from 'zod/v4';

/**
 * `/shows/:id/certifications`: one rating per country. `@trakt/api` types it as a single US rating, but the API answers
 * `[{ "certification": "TV-MA", "country": "us" }, ...]`.
 */
export const showCertificationsSchema = z.array(z.object({ certification: z.string(), country: z.string() }));
