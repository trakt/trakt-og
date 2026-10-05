type Part = { text: string; strong: boolean };

const name = (text: string): Part => ({ text, strong: true });
const plain = (text: string): Part => ({ text, strong: false });

/** "A wants", "A and B want", "A, B and C want", then "A, B and 12 others want to follow you." */
export function followRequestSummary(names: readonly string[]): readonly Part[] {
  const named = names.length > 3 ? names.slice(0, 2) : names;
  const others = names.length - named.length;
  const subjects = others > 0 ? [...named.map(name), name(`${others} others`)] : named.map(name);
  const verb = names.length === 1 ? ' wants to follow you.' : ' want to follow you.';
  return [
    ...subjects.flatMap((subject, i) => {
      if (i === 0) return [subject];
      return [plain(i === subjects.length - 1 ? ' and ' : ', '), subject];
    }),
    plain(verb),
  ];
}
