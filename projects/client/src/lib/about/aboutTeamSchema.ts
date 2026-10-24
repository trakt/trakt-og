import { z } from 'zod/v4';

const favorite = z.object({
  key: z.string(),
  title: z.string(),
  year: z.number().nullable(),
  href: z.string(),
  poster: z.string().nullable(),
  fanart: z.string().nullable(),
});

/** The about page's `AboutMember` list as the shared cache keeps it, read back from JSON. */
export const aboutTeamSchema = z.array(
  z.object({
    slug: z.string(),
    username: z.string(),
    name: z.string(),
    avatar: z.string(),
    location: z.string().nullable(),
    since: z.number().nullable(),
    favorites: z.array(favorite),
    episodes: z.number(),
    movies: z.number(),
  }),
);
