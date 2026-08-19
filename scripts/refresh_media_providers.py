from pathlib import Path
import re
import urllib.error
import urllib.request

TARGET = Path('jarvis-media-final.js')
REGISTRY_URLS = (
    'https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md',
    'https://github.com/TeamPiped/documentation/raw/refs/heads/main/content/docs/public-instances/index.md',
)


def fetch_registry():
    last_error = None
    for url in REGISTRY_URLS:
        try:
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'JARVIS-OS-CI/1.1',
                    'Accept': 'text/plain,text/markdown,*/*',
                },
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                text = response.read().decode('utf-8-sig')
            if text.strip():
                return text
        except (urllib.error.URLError, TimeoutError, UnicodeDecodeError) as exc:
            last_error = exc
    raise SystemExit(f'Could not fetch the official Piped provider registry: {last_error}')


def parse_piped_instances(text):
    instances = []
    seen = set()
    for line in text.splitlines():
        # Parse the table by columns instead of depending on exact whitespace.
        # The upstream registry currently contains rows such as:
        # | kavin.rocks (Official) | https://pipedapi.kavin.rocks | ... |
        columns = [part.strip() for part in line.split('|')]
        if len(columns) < 3:
            continue
        for column in columns[1:-1]:
            if re.fullmatch(r'https://[^\s|]+', column):
                api = column.rstrip('/')
                if ('piped' in api.lower() or 'api-piped' in api.lower()) and api not in seen:
                    seen.add(api)
                    instances.append(api)
                break
    return instances


text = fetch_registry()
piped = parse_piped_instances(text)
if not piped:
    raise SystemExit('No Piped API instances discovered from the official registry')

source = TARGET.read_text(encoding='utf-8')
replacement = "  const PIPED = [\n" + ''.join(f"    {api!r},\n" for api in piped).rstrip(',\n') + "\n  ];"
source, count = re.subn(r'  const PIPED = \[[\s\S]*?\n  \];', replacement, source, count=1)
if count != 1:
    raise SystemExit('Could not locate the PIPED provider array')

invidious = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com',
    'https://invidious.f5.si',
]
replacement = "  const INVIDIOUS = [\n" + ''.join(f"    {api!r},\n" for api in invidious).rstrip(',\n') + "\n  ];"
source, count = re.subn(r'  const INVIDIOUS = \[[\s\S]*?\n  \];', replacement, source, count=1)
if count != 1:
    raise SystemExit('Could not locate the INVIDIOUS provider array')

TARGET.write_text(source, encoding='utf-8')
print(f'REFRESHED_PIPED_PROVIDERS={len(piped)}')
print(f'REFRESHED_INVIDIOUS_PROVIDERS={len(invidious)}')
