from pathlib import Path
import re

MAIN = Path('src/main.ts')
text = MAIN.read_text(encoding='utf-8')

# Remove the whole legacy media setup function regardless of formatting/minification.
# The function is bounded by the next setup* declaration, so nested braces inside
# the legacy implementation cannot make a naive brace counter fail.
text, removed = re.subn(
    r"\nasync function setupMedia\(\)\{.*?(?=\nasync function setupSettings\(\))",
    "\n",
    text,
    count=1,
    flags=re.S,
)

# Remove every known invocation, including compact/awaited/void forms.
text = re.sub(
    r"\s*if\(active\s*===\s*['\"]media['\"]\)\s*(?:await\s+|void\s+)?setupMedia\(\);?",
    "",
    text,
)

# Remove any remaining legacy references. Fail closed if the old runtime survives.
if re.search(r"\bsetupMedia\s*\(", text) or 'pipedapi' in text.lower():
    raise SystemExit('Legacy media runtime/provider reference still present after retirement pass')

if removed != 1:
    raise SystemExit(f'Expected to retire exactly one setupMedia function, removed {removed}')

MAIN.write_text(text, encoding='utf-8')
print('Legacy Media runtime retired successfully.')
