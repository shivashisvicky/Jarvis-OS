from pathlib import Path

MAIN = Path('src/main.ts')
text = MAIN.read_text()

start_marker = '\nasync function setupMedia(){'
end_marker = '\nasync function setupSettings()'

start = text.find(start_marker)
if start != -1:
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit('Legacy setupMedia found, but setupMedia end marker is missing')
    text = text[:start] + text[end:]

# Remove every known invocation, including compact and awaited variants.
for invocation in (
    "if(active==='media')setupMedia();",
    "if(active==='media')await setupMedia();",
    "if(active==='media')void setupMedia();",
):
    text = text.replace(invocation, '')

# Fail closed. We must never silently ship the retired runtime again.
if 'async function setupMedia(' in text or "if(active==='media')setupMedia" in text:
    raise SystemExit('Legacy Media runtime still present after retirement pass')
if 'pipedapi' in text.lower():
    raise SystemExit('Legacy Piped provider reference still present in main.ts')

MAIN.write_text(text)
print('Legacy Media runtime retired successfully.')
