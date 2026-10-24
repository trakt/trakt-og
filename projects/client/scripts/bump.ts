// Dependency bump. Moves every exact pin in package.json to the newest release
// Bun allows, keeps the ones that pass `bun run ci`, and bisects out the ones that don't.
// Usage: bun run bump [--dry-run] [--out <dir>]
// --dry-run only print what each pin would move to; touches nothing.
// --out where to write title.txt, body.md and issues.json for review (default: a temp dir).
import { spawn } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { applyUpgrades } from './deps/applyUpgrades.ts';
import { bisectUpgrades } from './deps/bisectUpgrades.ts';
import type { BisectResult } from './deps/BisectResult.ts';
import type { BumpReport } from './deps/BumpReport.ts';
import { bumpTitle } from './deps/bumpTitle.ts';
import { dependencyHolds } from './deps/dependencyHolds.ts';
import type { HeldPackage } from './deps/HeldPackage.ts';
import { minimumAgeMinutes } from './deps/minimumAgeMinutes.ts';
import type { PackageJson } from './deps/PackageJson.ts';
import type { Packument } from './deps/Packument.ts';
import { parsePin } from './deps/parsePin.ts';
import type { Pin } from './deps/Pin.ts';
import { pickTargets } from './deps/pickTargets.ts';
import { pullRequestBody } from './deps/pullRequestBody.ts';
import { rejectedIssues } from './deps/rejectedIssues.ts';
import type { Targets } from './deps/Targets.ts';
import type { Upgrade } from './deps/Upgrade.ts';

const LOCKFILE = '../../bun.lock';
const FILES = ['package.json', LOCKFILE] as const;
type Snapshot = Readonly<Record<(typeof FILES)[number], string>>;

const LOG_TAIL_LINES = 60;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const outFlag = args.indexOf('--out');
const outArg = outFlag >= 0 ? args.at(outFlag + 1) : undefined;

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8'));
const writeJson = (path: string, value: unknown) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

// Same registries as .npmrc.
const registryUrl = (name: string) =>
  `${name.startsWith('@jsr/') ? 'https://npm.jsr.io' : 'https://registry.npmjs.org'}/${name.replace('/', '%2f')}`;

const fetchPackument = async (name: string): Promise<Packument> => {
  const response = await fetch(registryUrl(name), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${name}: registry answered ${response.status}`);
  return response.json();
};

const snapshot = async (): Promise<Snapshot> => {
  const [packageJson = '', lock = ''] = await Promise.all(FILES.map((file) => readFile(file, 'utf8')));
  return { 'package.json': packageJson, [LOCKFILE]: lock };
};

const restore = (files: Snapshot) => Promise.all(FILES.map((file) => writeFile(file, files[file])));

// Collects stdout and stderr into one log in the order they arrive, so the tail of a failure shows the error
// rather than whichever stream happened to be appended last.
const run = async (command: ReadonlyArray<string>) => {
  const [program = '', ...rest] = command;
  const child = spawn(program, rest, { env: { ...process.env, NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks: Array<string> = [`$ ${command.join(' ')}\n`];
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => chunks.push(chunk));
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => chunks.push(chunk));
  const success = await new Promise<boolean>((resolve) => {
    child.on('error', (error) => {
      chunks.push(`${error.message}\n`);
      resolve(false);
    });
    child.on('close', (code) => resolve(code === 0));
  });
  return { success, log: chunks.join('') };
};

// Runs each step until one fails. The log covers every step that ran.
const runAll = (steps: ReadonlyArray<ReadonlyArray<string>>) =>
  steps.reduce<Promise<{ success: boolean; log: string }>>(async (previous, step) => {
    const done = await previous;
    if (!done.success) return done;
    const next = await run(step);
    return { success: next.success, log: `${done.log}${next.log}` };
  }, Promise.resolve({ success: true, log: '' }));

const tail = (log: string) => log.trimEnd().split('\n').slice(-LOG_TAIL_LINES).join('\n');

const describe = (set: ReadonlyArray<Upgrade>) => set.map(({ pin, to }) => `${pin.key}@${to}`).join(', ');

// Writes the set on top of the baseline, then runs what CI runs. A passing probe becomes the new baseline; a failing one is rolled back.
const makeProbe = (initial: Snapshot, logs: Record<string, string>) => {
  const state = { baseline: initial };

  const probe = async (set: ReadonlyArray<Upgrade>) => {
    console.log(`probe: ${describe(set)}`);
    await restore(state.baseline);
    await writeJson('package.json', applyUpgrades(JSON.parse(state.baseline['package.json']), set));

    const verified = await runAll([['bun', 'install'], ['bun', 'run', 'ci']]);

    if (verified.success) {
      state.baseline = await snapshot();
      console.log('  passed');
      return true;
    }

    const [only] = set;
    if (only && set.length === 1) logs[`${only.pin.key}@${only.to}`] = tail(verified.log);
    await restore(state.baseline);
    console.log('  failed');
    return false;
  };

  return { probe, baseline: () => state.baseline };
};

const writeOutputs = async (report: BumpReport, out: string) => {
  const changed = report.minor.adopted.length + report.major.adopted.length > 0;
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/title.txt`, `${bumpTitle(report)}\n`);
  await writeFile(`${out}/body.md`, pullRequestBody(report));
  await writeJson(`${out}/issues.json`, rejectedIssues(report));

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) return;
  await appendFile(
    githubOutput,
    [`changed=${changed}`, `majors=${report.major.adopted.length > 0}`, `title=${bumpTitle(report)}`, ''].join('\n'),
  );
};

const packageJson = await readJson<PackageJson>('package.json');
const minimumAge = minimumAgeMinutes(await readFile('../../bunfig.toml', 'utf8'));
const pins = Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })
  .flatMap(([key, spec]) => {
    const pin = parsePin(key, spec);
    return pin ? [pin] : [];
  });

const now = new Date();
const targets: ReadonlyArray<{ pin: Pin; targets: Targets }> = await Promise.all(
  pins.map(async (pin) => ({
    pin,
    targets: pickTargets({
      current: pin.version,
      packument: await fetchPackument(pin.registryName),
      now,
      minimumAgeMinutes: minimumAge,
      hold: dependencyHolds[pin.key],
    }),
  })),
);

console.log(`Minimum release age: ${minimumAge} minutes (bunfig.toml minimumReleaseAge)`);
console.table(
  Object.fromEntries(
    targets.map(({ pin, targets }) => [pin.key, {
      current: pin.version,
      minor: targets.minor ?? '',
      major: targets.major ?? '',
      held: targets.held ?? '',
    }]),
  ),
);

const held: ReadonlyArray<HeldPackage> = targets.flatMap(({ pin, targets }) => {
  const hold = dependencyHolds[pin.key];
  return targets.held && hold ? [{ key: pin.key, current: pin.version, held: targets.held, reason: hold.reason }] : [];
});
const minorCandidates: ReadonlyArray<Upgrade> = targets.flatMap(({ pin, targets }) =>
  targets.minor ? [{ pin, to: targets.minor }] : []
);

if (dryRun) process.exit(0);

const original = await snapshot();
const logs: Record<string, string> = {};
const { probe, baseline } = makeProbe(original, logs);

const minor: BisectResult = await bisectUpgrades({ candidates: minorCandidates, probe });

// Majors go on top of the adopted minors, measured from the version the minor pass left them on.
const adoptedMinor = new Map(minor.adopted.map(({ pin, to }) => [pin.key, to]));
const majorCandidates: ReadonlyArray<Upgrade> = targets.flatMap(({ pin, targets }) =>
  targets.major ? [{ pin: { ...pin, version: adoptedMinor.get(pin.key) ?? pin.version }, to: targets.major }] : []
);
const major: BisectResult = await bisectUpgrades({ candidates: majorCandidates, probe });

// Leave the adopted set on disk, whatever the last probe was.
await restore(baseline());
await run(['bun', 'install']);

const report: BumpReport = { minor, major, held, logs };
const out = outArg ?? await mkdtemp(join(tmpdir(), 'og-bump-'));
await writeOutputs(report, out);

console.log(`\n${pullRequestBody(report)}`);
console.log(`Wrote ${out}/title.txt, body.md and issues.json`);
