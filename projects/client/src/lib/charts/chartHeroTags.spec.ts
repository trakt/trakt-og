import { describe, expect, it } from 'vitest';
import { chartHeroTags } from './chartHeroTags.ts';
import type { ChartCard } from './toChartCard.ts';

const card: ChartCard = {
  type: 'show',
  id: 199379,
  href: '/shows/visionquest',
  title: 'VisionQuest',
  year: 2026,
  released: true,
  runtime: 40,
  airedEpisodes: 4,
  tags: [{ text: '11,688 watchers' }],
  certification: 'TV-14',
  genres: ['Fantasy', 'Science Fiction', 'Drama'],
  network: 'Disney+',
};

describe('chartHeroTags', () => {
  it('should lead with the count in red, then the details without a show runtime', () => {
    expect(chartHeroTags(card)).toEqual([
      { text: '11,688 watchers', kind: 'primary' },
      { text: '2026' },
      { text: 'TV-14', kind: 'badge' },
      { segments: ['4 episodes'] },
      { segments: ['Fantasy', 'Science Fiction'] },
      { text: 'Disney+' },
    ]);
  });

  it('should keep the second count plain and give a movie its runtime', () => {
    const movie: ChartCard = {
      ...card,
      type: 'movie',
      airedEpisodes: undefined,
      network: undefined,
      tags: [{ text: '50 watchers' }, { text: '80 plays', kind: 'generic' }],
    };

    expect(chartHeroTags(movie).slice(0, 2)).toEqual([{ text: '50 watchers', kind: 'primary' }, { text: '80 plays' }]);
    expect(chartHeroTags(movie)).toContainEqual({ segments: ['40m'] });
  });

  it('should not repeat a count the details already show', () => {
    const anticipated = { ...card, tags: [{ text: '20 lists', kind: 'list' as const }, { text: 'Disney+' }] };

    expect(chartHeroTags(anticipated).filter((tag) => 'text' in tag && tag.text === 'Disney+')).toHaveLength(1);
  });
});
