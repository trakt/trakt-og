import type { BumpReport } from './BumpReport.ts';
import { groupUpgrades } from './groupUpgrades.ts';
import type { RejectedIssue } from './RejectedIssue.ts';
import { unitName } from './unitName.ts';

const FENCE = '````'; // four, so a log line with three can't close it

// One `chore(deps): adopt <package> <version>` issue per rejected unit (a package, or a family like `@tiptap/*`),
// so an agent can pick up the migration.
// A unit whose minor and major both failed gets one issue, for the major: adopting it covers both.
export function rejectedIssues(report: BumpReport): ReadonlyArray<RejectedIssue> {
  const byUnit = new Map(
    [...groupUpgrades(report.minor.rejected), ...groupUpgrades(report.major.rejected)].map((unit) => [
      unitName(unit),
      unit,
    ]),
  );

  return [...byUnit.values()].flatMap((unit) => {
    const [first] = unit;
    if (!first) return [];
    const name = unitName(unit);
    const { version } = first.pin;
    const { to } = first;
    const members = unit.length > 1 ? ` (${unit.map(({ pin }) => `\`${pin.key}\``).join(', ')})` : '';
    const titlePrefix = `chore(deps): adopt ${name} `;
    return [
      {
        titlePrefix,
        title: `${titlePrefix}${to}`,
        body: [
          `The weekly dependency bump (\`deps.yml\`) couldn't move \`${name}\`${members} from ${version} to ${to}: install, lint, check, test or build failed with it applied, so it stays on its current pin.`,
          '',
          'Acceptance: `' +
            name +
            "` is pinned to the newest release Bun allows, `bun run ci` is green, and any code the new version needs is changed in the same PR. If it can't move yet (an upstream package doesn't support it), add a hold with its reason in `scripts/deps/dependencyHolds.ts` instead.",
          '',
          '<details><summary>End of the failing log</summary>',
          '',
          FENCE,
          report.logs[`${name}@${to}`] ?? '(no log)',
          FENCE,
          '',
          '</details>',
        ].join('\n'),
      },
    ];
  });
}
