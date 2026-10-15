import fry from '$lib/assets/placeholders/person-fry.png';
import leela from '$lib/assets/placeholders/person-leela.png';
import zoidberg from '$lib/assets/placeholders/person-zoidberg.png';

/** A missing headshot's silhouette, like OG's Futurama avatars: Leela for women, Fry for men, Zoidberg for the rest. */
export function personPlaceholder(gender: string | null | undefined): string {
  if (gender === 'female') return leela;
  if (gender === 'male') return fry;
  return zoidberg;
}
