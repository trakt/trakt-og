import { describe, expect, it } from 'vitest';
import { toEpisodeSeo } from './toEpisodeSeo.ts';

const episode = {
  showTitle: 'Severance',
  season: 1,
  episodeNumber: 2,
  title: 'Half Loop',
  overview: 'Mark gets a visit.',
  screenshot: 'https://media.trakt.tv/images/episodes/screenshots/full/a.jpg.webp',
  fanart: 'https://media.trakt.tv/images/shows/fanarts/full/b.jpg.webp',
};
const open = { title: false, overview: false, screenshot: false };

describe('seo: toEpisodeSeo', () => {
  it('should title the episode with its show and code, and use its screenshot', () => {
    expect(toEpisodeSeo({ episode, spoilers: open })).toEqual({
      title: 'Severance S01E02: Half Loop',
      description: 'Mark gets a visit.',
      image: episode.screenshot,
      imageAlt: 'Severance S01E02: Half Loop',
      type: 'video.episode',
    });
  });

  it("should fall back to a fixed line and the show's fanart", () => {
    const seo = toEpisodeSeo({ episode: { ...episode, overview: null, screenshot: undefined }, spoilers: open });

    expect(seo.description).toBe('Season 1, episode 2 of Severance.');
    expect(seo.image).toBe(episode.fanart);
  });

  describe('for hidden spoilers', () => {
    it('should leave the title, overview and screenshot out', () => {
      const seo = toEpisodeSeo({ episode, spoilers: { title: true, overview: true, screenshot: true } });

      expect(seo.title).toBe('Severance S01E02');
      expect(seo.description).toBe('Season 1, episode 2 of Severance.');
      expect(seo.image).toBe(episode.fanart);
    });
  });
});
