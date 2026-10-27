import { toBreadcrumbJsonLd } from '../jsonLd/toBreadcrumbJsonLd.ts';
import { toTitleCrumbs } from '../jsonLd/toTitleCrumbs.ts';
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

type Params = {
  /** The title's own name: "Inception (2010)", `Severance 1x02 "Half Loop"`, "Adam Scott". */
  title: string;
  /** The title's own page. */
  href: string;
  /** The tag bar's way up to the title: a season's show, an episode's show and season. */
  parents?: readonly { readonly title: string; readonly href?: string }[];
  subpage: keyof typeof LINES;
  /** The parent's fanart, else its poster. */
  image?: string;
};

/** A title's subpage: "Inception (2010): People", a fixed line, the title's own art and the trail down to it. */
export function toSubpageSeo({ title, href, parents, subpage, image }: Params): SeoMeta {
  return {
    title: `${title}: ${subpage}`,
    description: LINES[subpage](title),
    image,
    imageAlt: title,
    jsonLd: [toBreadcrumbJsonLd([...toTitleCrumbs({ title, href, parents }), { name: subpage }])],
  };
}
