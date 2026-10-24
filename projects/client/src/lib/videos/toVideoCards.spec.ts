import type { VideoResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { defaultVideoTab, toVideoCards, toVideoTabs, type VideoCard } from './toVideoCards.ts';

const video = (overrides: Partial<VideoResponse>): VideoResponse => ({
  title: 'Official Trailer',
  url: 'https://youtube.com/watch?v=HhesaQXLuRY',
  site: 'youtube',
  type: 'trailer',
  size: 1080,
  official: true,
  published_at: '2025-01-01T00:00:00.000Z',
  country: 'us',
  language: 'en',
  ...overrides,
});

const card = (type: VideoCard['type'], id: string): VideoCard => ({
  title: id,
  href: `https://youtube.com/watch?v=${id}`,
  image: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  type,
});

describe('toVideoCards', () => {
  describe('toVideoCards', () => {
    it('should map a YouTube video to a card with its 16:9 thumbnail', () => {
      expect(toVideoCards([video({})])).toEqual([
        {
          title: 'Official Trailer',
          href: 'https://youtube.com/watch?v=HhesaQXLuRY',
          image: 'https://i.ytimg.com/vi/HhesaQXLuRY/mqdefault.jpg',
          type: 'trailer',
        },
      ]);
    });

    it('should put the newest first', () => {
      const cards = toVideoCards([
        video({ title: 'Old', url: 'https://youtu.be/oldvideo01', published_at: '2024-01-01T00:00:00.000Z' }),
        video({ title: 'New', url: 'https://youtu.be/newvideo01', published_at: '2025-06-01T00:00:00.000Z' }),
      ]);
      expect(cards.map(({ title }) => title)).toEqual(['New', 'Old']);
    });

    it('should leave out videos that are not on YouTube, unknown types and repeated links', () => {
      const cards = toVideoCards([
        video({ title: 'Vimeo', url: 'https://vimeo.com/123456', site: 'vimeo' }),
        video({ title: 'Broken', url: 'not a url' }),
        video({ title: 'Bonus', type: 'bonus' }),
        video({ title: 'First' }),
        video({ title: 'Again' }),
      ]);
      expect(cards.map(({ title }) => title)).toEqual(['First']);
    });
  });

  describe('toVideoTabs', () => {
    it('should offer All, then each type in the dropdown order', () => {
      const cards = [card('featurette', 'f1'), card('trailer', 't1'), card('featurette', 'f2')];
      expect(toVideoTabs(cards).map(({ id, videos }) => [id, videos.length])).toEqual([
        ['all', 3],
        ['trailer', 1],
        ['featurette', 2],
      ]);
    });

    it('should skip All when every video is one type', () => {
      expect(toVideoTabs([card('clip', 'c1')]).map(({ id }) => id)).toEqual(['clip']);
    });
  });

  describe('defaultVideoTab', () => {
    it('should open on the trailers, then the teasers, then All', () => {
      const all = [card('clip', 'c1'), card('teaser', 'te1'), card('trailer', 'tr1')];
      expect(defaultVideoTab(toVideoTabs(all))?.id).toBe('trailer');
      expect(defaultVideoTab(toVideoTabs(all.slice(0, 2)))?.id).toBe('teaser');
      expect(defaultVideoTab(toVideoTabs([card('clip', 'c1'), card('recap', 'r1')]))?.id).toBe('all');
    });
  });
});
