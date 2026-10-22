/** OG's season label: "Specials" for season 0, otherwise "Season N". */
export const seasonName = (number: number) => (number === 0 ? 'Specials' : `Season ${number}`);
