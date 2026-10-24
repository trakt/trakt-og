// Extracts one OG icon from the fonts in into src/lib/icons/<family>/<name>.svg.
// Usage: bun run icon <family> <name>, e.g. `bun run icon thin gear` for OG's `fa-thin fa-gear`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { extractIcon } from '../src/lib/icons/extraction/extractIcon.ts';
import { iconFamilies } from '../src/lib/icons/extraction/iconFamilies.ts';
import { isIconFamily } from '../src/lib/icons/extraction/isIconFamily.ts';

const USAGE = `Usage: bun run icon <family> <name>\nFamilies: ${Object.keys(iconFamilies).join(', ')}`;

const [family = '', name = ''] = process.argv.slice(2);
if (!isIconFamily(family) || !name) {
  console.error(USAGE);
  process.exit(1);
}

const railsRoot = process.env.OG_ASSET_PATH ?? './assets';

const readFromRails = async <T>(path: string, read: (fullPath: string) => Promise<T>) => {
  try {
    return await read(`${railsRoot}/${path}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    console.error(`Can't find ${railsRoot}/${path}. Point OG_ASSET_PATH at a local asset directory.`);
    process.exit(1);
  }
};

try {
  const icon = await extractIcon({
    family,
    name,
    readText: (path) => readFromRails(path, (fullPath) => readFile(fullPath, 'utf8')),
    readBytes: (path) => readFromRails(path, async (fullPath) => new Uint8Array(await readFile(fullPath)).buffer),
  });

  const dir = `src/lib/icons/${family}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/${icon.name}.svg`, icon.svg);

  const alias = icon.name === name ? '' : ` ("${name}" is an alias of "${icon.name}")`;
  console.log(`Wrote ${dir}/${icon.name}.svg${alias}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
