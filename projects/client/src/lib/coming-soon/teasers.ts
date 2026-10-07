/** The coming-soon designs `/` rotates through: the B-movie lobby card, the VHS tape, the séance and the tabloid. */
export const teasers = ['lobby', 'vhs', 'seance', 'tabloid'] as const;

export type Teaser = (typeof teasers)[number];
