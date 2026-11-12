import type { SeoMeta } from '../seo/SeoMeta.ts';

/** The box office page's head: the list's description under the title, else the chart's own line. */
export const toBoxOfficeSeo = (description: string): SeoMeta => ({
  title: 'Weekend Box Office',
  description: description || 'The top 10 movies at the US box office this weekend, with what each grossed.',
});
