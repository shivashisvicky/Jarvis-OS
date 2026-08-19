from pathlib import Path
import re
import urllib.request

TARGET = Path('jarvis-media-final.js')
url = 'https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md'

req = urllib.request.Request(url, headers={'User-Agent': 'JARVIS-OS-CI/1.0'})
with urllib.request.urlopen(req, timeout=15) as response:
    text = response.read().decode('utf-8')

piped = []
for match in re.finditer(r'^\|[^|]+\|\s*(https://[^\s|]+)\s*\|', text, re.M):
    api = match.group(1).rstrip('/')
    if api not in piped:
        piped.append(api)

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
