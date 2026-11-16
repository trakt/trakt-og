import type { BumpReport } from './BumpReport.ts';
import { groupUpgrades } from './groupUpgrades.ts';
import type { Upgrade } from './Upgrade.ts';
import { unitName } from './unitName.ts';

const unitLines = (upgrades: ReadonlyArray<Upgrade>) =>
  groupUpgrades(upgrades).flatMap((unit) => {
    const [first] = unit;
    return first ? [`- \`${unitName(unit)}\` ${first.pin.version} → ${first.to}`] : [];
  });

const section = (heading: string, lines: ReadonlyArray<string>) =>
  lines.length > 0 ? [`# ${heading}`, '', ...lines, ''] : [];

// The weekly bump pull request's description, in markdown.
export function pullRequestBody(report: BumpReport): string {
  const rejected = [...report.minor.rejected, ...report.major.rejected];
  const hasMajors = report.major.adopted.length > 0;

  return (
    [
      'Dependency bump from `bun run bump`. Every candidate was installed and verified with `bun run ci`. Candidates that broke were bisected out and stay on their current pin; file each proposed adoption as a trakt/trakt-og issue.',
      '',
      hasMajors
        ? 'This run includes major bumps. Keep the PR as a draft until a human has reviewed them.'
        : 'Minor and patch bumps only. A human merges it after review.',
      '',
      ...section('Minor and patch', unitLines(report.minor.adopted)),
      ...section('Major', unitLines(report.major.adopted)),
      ...section('Reverted', unitLines(rejected)),
      ...section(
        'Held',
        report.held.map(
          ({ key, current, held, reason }) => `- \`${key}\` stays on ${current} (${held} is out): ${reason}`,
        ),
      ),
    ]
      .join('\n')
      .trimEnd() + '\n'
  );
}
