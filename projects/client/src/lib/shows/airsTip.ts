import type { AirsTip } from '../components/media/AirsTip.ts';

type AirsTipParams = {
  readonly network?: string | null;
  readonly now: Date;
  /** Splits the broadcast into its date and time the way the page shows them (`airDateParts`). */
  readonly parts: (at: string) => { date: string; time: string };
};

/** A streaming tag's tooltip: when the episode airs on TV, or aired once it has, and on which network. */
export function airsTip(
  firstAired: string | null | undefined,
  { network, now, parts }: AirsTipParams,
): AirsTip | undefined {
  if (!firstAired) return undefined;
  return {
    label: Date.parse(firstAired) > now.getTime() ? 'Airs' : 'Aired',
    ...parts(firstAired),
    ...(network ? { network } : {}),
  };
}
