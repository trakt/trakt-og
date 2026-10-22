import type { VideoResponse } from '@trakt/api';
import { youtubeId } from '../components/dialog/youtubeId.ts';
import { isVideoType, type VideoTabId, type VideoType, videoTypes } from './videoTypes.ts';
import { uniqueBy } from '../utils/uniqueBy.ts';

export type VideoCard = {
  readonly title: string;
  /** The YouTube link, which a plain click plays in the video popup instead. */
  readonly href: string;
  /** YouTube's 16:9 thumbnail; its 4:3 ones letterbox a widescreen video. */
  readonly image: string;
  readonly type: VideoType;
};

/** A type dropdown's choice: one type's videos, or every video. */
export type VideoTab = {
  readonly id: VideoTabId;
  readonly label: string;
  readonly videos: readonly VideoCard[];
};

function toVideoCard(video: VideoResponse): VideoCard | null {
  if (!isVideoType(video.type) || !URL.canParse(video.url)) return null;
  const id = youtubeId(new URL(video.url));
  if (!id) return null;
  return { title: video.title, href: video.url, image: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, type: video.type };
}

/**
 * An item's videos as fanart cards, newest first. Only YouTube videos have a thumbnail and play in the popup, so the
 * rest are left out, as are types the dropdowns don't know and a link listed twice.
 */
export function toVideoCards(videos: readonly VideoResponse[]): readonly VideoCard[] {
  const cards = videos
    .toSorted((a, b) => b.published_at.localeCompare(a.published_at))
    .flatMap((video) => toVideoCard(video) ?? []);
  return uniqueBy(cards, ({ href }) => href);
}

/** The type dropdowns' choices: All, then each type with videos in the dropdowns' order. One type needs no All. */
export function toVideoTabs(cards: readonly VideoCard[]): readonly VideoTab[] {
  const types = (Object.keys(videoTypes) as VideoType[])
    .map((id) => ({ id, label: videoTypes[id].plural, videos: cards.filter((card) => card.type === id) }))
    .filter(({ videos }) => videos.length > 0);
  return types.length > 1 ? [{ id: 'all', label: 'All', videos: cards }, ...types] : types;
}

/** The choice a row opens on: the trailers, else the teasers, else the first. */
export function defaultVideoTab(tabs: readonly VideoTab[]): VideoTab | undefined {
  return tabs.find(({ id }) => id === 'trailer') ?? tabs.find(({ id }) => id === 'teaser') ?? tabs[0];
}
