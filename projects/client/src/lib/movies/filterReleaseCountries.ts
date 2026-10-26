/** The picked country (`all` for every one) when it has a date in the picked column (`all` for any). */
export function filterReleaseCountries<T extends { readonly code: string; readonly cells: readonly unknown[][] }>({
  countries,
  columns,
  country,
  column,
}: {
  countries: readonly T[];
  columns: readonly { readonly id: string }[];
  country: string;
  column: string;
}): readonly T[] {
  const index = columns.findIndex(({ id }) => id === column);
  return countries.filter(
    ({ code, cells }) => (country === 'all' || code === country) && (index < 0 || (cells.at(index)?.length ?? 0) > 0),
  );
}
