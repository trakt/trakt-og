/** A streaming tag's tooltip: when the episode airs on TV, its date and time apart, and the network. */
export type AirsTip = {
  readonly label: 'Airs' | 'Aired';
  readonly date: string;
  readonly time: string;
  readonly network?: string;
};
