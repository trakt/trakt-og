import type { CheckResult } from './CheckResult.ts';

interface FormatReportParams {
  /** Results per sample page, one row each. */
  pages: readonly CheckResult[];
  /** robots.txt, sitemaps, canonical variants and preview host results. */
  site: readonly CheckResult[];
  /** Every user-agent a page was fetched as, so a failure seen by all of them says so once. */
  agents: readonly string[];
}

const unique = (values: readonly string[]) => [...new Set(values)];

const cell = (results: readonly CheckResult[]) => {
  if (results.length === 0) return '-';
  if (results.every((result) => result.pass)) return 'ok';
  return results.every((result) => result.pass || result.known) ? 'known' : 'FAIL';
};

const table = (title: string, results: readonly CheckResult[]) => {
  const rows = unique(results.map((result) => result.row));
  const groups = unique(results.map((result) => result.group));
  const lines = [
    [title, ...groups],
    ...rows.map((row) => [
      row,
      ...groups.map((group) => cell(results.filter((result) => result.row === row && result.group === group))),
    ]),
  ];
  const widths = lines.at(0)?.map((_, column) => Math.max(...lines.map((line) => line.at(column)?.length ?? 0))) ?? [];

  return lines.map((line) =>
    line
      .map((value, column) => value.padEnd(widths.at(column) ?? 0))
      .join('  ')
      .trimEnd(),
  );
};

interface Failure {
  row: string;
  /** The failure's text without its row. */
  what: string;
}

const failure = (same: readonly CheckResult[], agents: readonly string[]): Failure => {
  const first = same.at(0);
  const seenBy = unique(same.flatMap((result) => (result.agent ? [result.agent] : [])));
  const who = seenBy.length === 0 || seenBy.length === agents.length ? '' : ` [${seenBy.join(', ')}]`;
  const detail = first?.detail ? `: ${first.detail}` : '';
  return { row: first?.row ?? '', what: `${first?.label}${detail}${who}` };
};

// One line per distinct failure, naming every row that has it, and the user-agents when only some of them saw it.
const failures = (results: readonly CheckResult[], agents: readonly string[]) => {
  const perRow = Map.groupBy(
    results.filter((result) => !result.pass && !result.known),
    (result) => [result.row, result.group, result.label, result.detail ?? ''].join('\u0000'),
  );
  const byWhat = Map.groupBy(
    [...perRow.values()].map((same) => failure(same, agents)),
    (entry) => entry.what,
  );

  return [...byWhat].map(([what, rows]) => `  ${what} (${rows.map((entry) => entry.row).join(', ')})`);
};

/** The pass/fail tables (one cell per row and check group), every distinct failure, and a total. */
export function formatReport({ pages, site, agents }: FormatReportParams): string {
  const all = [...pages, ...site];
  const failed = failures(all, agents);
  const known = unique(
    all.filter((result) => !result.pass && result.known).map((result) => `  ${result.label} (${result.known})`),
  );
  const passed = all.filter((result) => result.pass).length;

  return [
    ...table('page', pages),
    '',
    ...table('site', site),
    ...(failed.length > 0 ? ['', `Failures (${failed.length}):`, ...failed] : []),
    ...(known.length > 0 ? ['', `Known issues (${known.length}), not counted as failures:`, ...known] : []),
    '',
    `${passed} of ${all.length} checks passed${known.length > 0 ? `, ${known.length} known` : ''}.`,
  ].join('\n');
}
