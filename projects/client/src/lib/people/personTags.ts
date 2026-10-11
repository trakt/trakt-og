import { type DateOrder, formatDate } from '../utils/formatDate.ts';

type PersonFacts = {
  readonly birthday?: string | null;
  readonly death?: string | null;
  readonly known_for_department?: string | null;
};

type PersonTagsOptions = {
  /** The viewer's date, `YYYY-MM-DD`. Left out, there's no age. */
  readonly today?: string;
  readonly order?: DateOrder;
};

const monthDay = (date: string) => date.slice(5, 10);
const titleize = (text: string) => text.replace(/\b\w/g, (letter) => letter.toUpperCase());

function age(birthday: string, today: string) {
  const years = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4));
  return monthDay(today) >= monthDay(birthday) ? years : years - 1;
}

/**
 * A person's tags in search: "Died Mar 12, 1952" for someone who has died, otherwise their age ("Age 57"), then
 * what they're known for ("Acting"). Dates follow the viewer's order; they're bare dates, so they're read in UTC.
 */
export function personTags(person: PersonFacts, { today, order = 'mdy' }: PersonTagsOptions = {}): string[] {
  const { birthday, death, known_for_department: knownFor } = person;
  const life = death
    ? [`Died ${formatDate(death, { format: 'll', timeZone: 'UTC', order })}`]
    : birthday && today
    ? [`Age ${age(birthday, today)}`]
    : [];
  return [...life, ...(knownFor ? [titleize(knownFor)] : [])];
}
