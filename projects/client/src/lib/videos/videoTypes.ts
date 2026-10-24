/** The API's video types in the order the type dropdowns list them, each with its singular and plural label. */
export const videoTypes = {
  trailer: { label: 'Trailer', plural: 'Trailers' },
  teaser: { label: 'Teaser', plural: 'Teasers' },
  clip: { label: 'Clip', plural: 'Clips' },
  featurette: { label: 'Featurette', plural: 'Featurettes' },
  'behind the scenes': { label: 'Behind the Scenes', plural: 'Behind the Scenes' },
  recap: { label: 'Recap', plural: 'Recaps' },
  'opening credits': { label: 'Opening Credits', plural: 'Opening Credits' },
  bloopers: { label: 'Bloopers', plural: 'Bloopers' },
} as const;

export type VideoType = keyof typeof videoTypes;

/** A type dropdown's choice: one type, or every video. */
export type VideoTabId = VideoType | 'all';

export const isVideoType = (type: string): type is VideoType => Object.hasOwn(videoTypes, type);

/** A choice as a URL or CSS name: "behind the scenes" is `behind-the-scenes`. */
export const videoTabSlug = (id: VideoTabId) => id.replaceAll(' ', '-');

/** The choice a videos page link names, or `undefined` for none or one the API doesn't have. */
export function readVideoTab(search: URLSearchParams): VideoTabId | undefined {
  const id = search.get('type')?.replaceAll('-', ' ');
  if (id === 'all') return id;
  return id && isVideoType(id) ? id : undefined;
}

/** An item's videos page, opened on one choice: `/shows/visionquest/videos?type=featurette`. The default stays bare. */
export const videosHref = (href: string, id?: VideoTabId) =>
  id ? `${href}/videos?${new URLSearchParams({ type: videoTabSlug(id) })}` : `${href}/videos`;
