import type { ChartName } from './chartNames.ts';
import { type ChartPeriod, chartPeriodText } from './chartPeriod.ts';

type Params = { type: 'shows' | 'movies'; chart: ChartName; period: ChartPeriod };

/** A chart page's head, as OG titled each of its actions. */
export function toChartSeo({ type, chart, period }: Params): { title: string; description: string } {
  const noun = type === 'shows' ? 'show' : 'movie';
  const periodText = chartPeriodText(period);
  return {
    trending: {
      title: `Trending ${type}`,
      description: `All ${type} the Trakt community has watched recently!`,
    },
    popular: { title: `Popular ${type}`, description: `Popular ${type} as voted by the Trakt community.` },
    anticipated: {
      title: `Anticipated ${type}`,
      description: `Most anticipated ${type} in the Trakt community.`,
    },
    favorited: {
      title: `Most favorited ${type} for ${periodText}`,
      description: `The most favorited ${type} for ${periodText} by the Trakt community.`,
    },
    watched: {
      title: `Most watched ${type} for ${periodText}`,
      description: `Most watched ${type} for ${periodText} by the Trakt community.`,
    },
    played: {
      title: `Most played ${type} for ${periodText}`,
      description: `The most played ${type} for ${periodText} by the Trakt community.`,
    },
    recommendations: {
      title: `Recommended ${type}`,
      description: `Your personalized ${noun} recommendations.`,
    },
  }[chart];
}
