// Reads bunfig.toml's `minimumReleaseAge` (seconds), so the bump job and `bun install` apply the same rule.
// Only the whole-seconds form is supported; og sets it that way so there's one number to read.
const SETTING = /^[ \t]*minimumReleaseAge[ \t]*=[ \t]*([^#\s]+)[ \t]*(?:#.*)?$/m;

export function minimumAgeMinutes(bunfigToml: string): number {
  const value = SETTING.exec(bunfigToml)?.[1] ?? '';
  if (!/^\d+$/.test(value)) {
    throw new Error('bunfig.toml needs `minimumReleaseAge` as a whole number of seconds, e.g. 86400 for 24h.');
  }
  return Number(value) / 60;
}
