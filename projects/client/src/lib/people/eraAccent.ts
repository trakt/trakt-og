const ACCENTS = 8;

/** An era's color, by its place in the career: the person tokens' eight accents, cycled from the first era. */
export const eraAccent = (index: number) => `var(--color-person-era-${(index % ACCENTS) + 1})`;
