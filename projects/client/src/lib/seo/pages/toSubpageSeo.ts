import type { SeoMeta } from '../SeoMeta.ts';

const LINES = {
  People: (title: string) => `The cast and crew of ${title}.`,
  Stats: (title: string) => `Ratings, plays, watchers and lists for ${title} on Trakt.`,
  Lists: (title: string) => `Lists featuring ${title}, from the Trakt community.`,
  Videos: (title: string) => `Trailers, teasers and clips for ${title}.`,
  'Release Dates': (title: string) => `Release dates for ${title} around the world.`,
  Comments: (title: string) => `Reviews and shouts about ${title} from the Trakt community.`,
  Seasons: (title: string) => `Every season of ${title}, with ratings and air dates.`,
  Episodes: (title: string) => `Every episode of ${title}, season by season.`,
} as const;

export type Subpage = keyof typeof LINES;

type Params = {
  /** The title's own name: "Inception (2010)", `Severance 1x02 "Half Loop"`, "Adam Scott". */
  title: string;
  subpage: Subpage;
  /** The parent's fanart, else its poster. */
  image?: string;
};

/** A title's subpage: "Inception (2010): People", a fixed line and the title's own art. */
export function toSubpageSeo({ title, subpage, image }: Params): SeoMeta {
  const heading = `${title}: ${subpage}`;
  return { title: heading, description: LINES[subpage](title), image, imageAlt: title };
}
