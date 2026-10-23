#!/usr/bin/env bash
# Scan tracked files, branch commit messages and an optional public PR body.
# `leak-check --text <file>` scans only that file's text, for generated copy that's about to be published.
# Exact-line exceptions use repository-relative path, a tab, then the complete line.
set -euo pipefail
usage() { echo 'usage: leak-check [pr] | leak-check --text <file>' >&2; exit 1; }
text=''
if [ "${1:-}" = --text ]; then
  [ "$#" = 2 ] || usage
  text=$(realpath "$2")
  pr=''
else
  [ "$#" -le 1 ] || usage
  pr="${1:-}"
fi
[ -z "$pr" ] || [[ "$pr" =~ ^[0-9]+$ ]] || { echo 'leak-check: PR number must be digits' >&2; exit 1; }
root=$(git rev-parse --show-toplevel)
cd "$root"
python3 - "$pr" "$text" <<'PY'
import pathlib
import re
import subprocess
import sys

# Split literal names so the guard can scan its own source without an exemption.
patterns = [
    r'\.' + r'rb:[0-9]', 'trakt-' + 'rails', 'rails-' + 'web', 'og-rails-' + 'throwaway',
    'trakt/' + 'og-' + 'legacy', 'og-' + 'legacy', 'trakt-' + 'workers/', 'v3/' + 'workers',
    r'app/(controllers|views|models|helpers)/', 'OFFICIAL_TRAKT_' + 'APP_UIDS',
    'plan/' + 'inventory', r'route-map\.md', '/' + 'Users/', 'scratch' + 'pad',
    'plan/' + r'(overlay\.md|README\.md)', r'\.' + r'rb\b', 'trakt-' + 'workers',
    'TRAKT_' + 'RAILS_PATH', 'bin/' + 'og-', r'\bRails\b',
    'oauth_' + r'applications\.tier', '#' + r'199\b',
]
guard = re.compile('|'.join(patterns))
scripts = pathlib.Path('projects/client/scripts')
exception_file = scripts / 'leak-check.allowlist'
exceptions = set(exception_file.read_text().splitlines())
if any('\t' not in entry or not entry.split('\t', 1)[0] for entry in exceptions):
    sys.exit('leak-check: exact-line exceptions must use path, tab, complete line')
hits = 0
text = sys.argv[2]

def scan(name, content):
    global hits
    for number, line in enumerate(content.splitlines(), 1):
        if name == str(exception_file) and line in exceptions:
            continue
        for match in guard.finditer(line):
            if f'{name}\t{line}' in exceptions:
                continue
            print(f'{name}:{number}:{match.group()}')
            hits += 1

if text:
    scan('text', pathlib.Path(text).read_text())
    print(f'leak-check: {hits} hits in the text')
    sys.exit(1 if hits else 0)

files = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
for name in files:
    path = pathlib.Path(name)
    if not name or not path.is_file():
        continue
    data = path.read_bytes()
    scan(name, name)
    scan(name, data.decode('utf-8', errors='replace'))

commits = subprocess.check_output(['git', 'rev-list', 'origin/main..HEAD'], text=True).splitlines()
for commit in commits:
    message = subprocess.check_output(['git', 'show', '-s', '--format=%B', commit], text=True)
    scan(f'commit/{commit}', message)

if sys.argv[1]:
    body = subprocess.check_output([
        'gh', 'pr', 'view', sys.argv[1], '--repo', 'trakt/og', '--json', 'body', '--jq', '.body'
    ], text=True)
    scan(f'pr/{sys.argv[1]}', body)

print(f'leak-check: {hits} hits; {sum(bool(f) for f in files)} tracked files; {len(commits)} branch commits')
sys.exit(1 if hits else 0)
PY
