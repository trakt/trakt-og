import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { withClientId } from './withClientId.ts';

// `bun run client:setup <client id>`: the local settings for a Standard Trakt app, the same in every shell.
const ENV = '.env.development';
const ENV_EXAMPLE = '.env.example';
const DEV_VARS = '.dev.vars';
const DEV_VARS_EXAMPLE = '.dev.vars.example';

/** A file's text, read as UTF-16 when Windows PowerShell 5.1 wrote it that way. */
function readText(path: string): string {
  const bytes = readFileSync(path);
  return bytes[0] === 0xff && bytes[1] === 0xfe ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8');
}

const id = process.argv[2]?.trim() ?? '';
if (!/^[\w-]+$/.test(id)) {
  console.error('Usage: bun run client:setup <client id>');
  console.error('Copy the Client ID from your Trakt app at https://trakt.tv/oauth/applications.');
  process.exit(1);
}

const created = !existsSync(ENV);
writeFileSync(ENV, withClientId(readText(created ? ENV_EXAMPLE : ENV), id), 'utf8');
console.log(`${created ? 'Created' : 'Updated'} projects/client/${ENV} with your client ID.`);

if (existsSync(DEV_VARS)) {
  console.log(`Kept projects/client/${DEV_VARS}.`);
} else {
  copyFileSync(DEV_VARS_EXAMPLE, DEV_VARS);
  console.log(`Created projects/client/${DEV_VARS}.`);
}

console.log('Next: bun run client:dev');
