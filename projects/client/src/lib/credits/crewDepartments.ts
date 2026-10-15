import { titleize } from '../components/summary/names.ts';

// these departments first, then the rest alphabetically.
const FIRST_DEPARTMENTS = ['created by', 'directing', 'writing', 'production'];
const rank = (department: string) => {
  const index = FIRST_DEPARTMENTS.indexOf(department);
  return index === -1 ? FIRST_DEPARTMENTS.length : index;
};

const parameterize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * A `/people` crew record in OG's order: created by, directing, writing, production, then the rest alphabetically.
 * Empty departments are left out. Each gets an id ("created-by") and a label ("Created By").
 */
export function crewDepartments<Member>(
  crew: Readonly<Partial<Record<string, readonly Member[]>>> | null | undefined,
): { id: string; label: string; members: readonly Member[] }[] {
  return Object.entries(crew ?? {})
    .filter((entry): entry is [string, readonly Member[]] => (entry[1]?.length ?? 0) > 0)
    .toSorted(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([department, members]) => ({ id: parameterize(department), label: titleize(department), members }));
}
