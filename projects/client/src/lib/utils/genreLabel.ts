import { titleize } from '../components/summary/names.ts';

const OVERRIDES: Readonly<Record<string, string>> = { 'home-and-garden': 'Home & Garden' };

/** A genre slug in OG's Title Case: "science-fiction" → "Science Fiction". */
export const genreLabel = (slug: string) => OVERRIDES[slug] ?? titleize(slug);
