/** Time since `at`, as short as it gets: "24m", "15h", "2d". */
export function shortAgo(at: string, now: Date): string {
  const minutes = Math.max(1, Math.floor((now.getTime() - Date.parse(at)) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}
