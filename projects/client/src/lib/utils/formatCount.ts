const grouped = new Intl.NumberFormat('en-US');

/** A count with thousands separators, "1,234". One shared formatter: building one per call is what costs on a Worker. */
export const formatCount = (n: number) => grouped.format(n);
