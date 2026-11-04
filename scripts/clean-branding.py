from pathlib import Path
import re
import sys

target = Path(sys.argv[1])
html = target.read_text(encoding="utf-8")
css = re.compile(r'\.brand-mark\{[^}]*\}\.brand-mark\.large\{[^}]*\}\.brand-mark\.hero\{[^}]*\}\.logo \.brand-mark\{[^}]*\}')
html, count = css.subn("", html, count=1)
if count != 1:
    raise SystemExit("Expected original brand-mark CSS was not found; refusing unsafe rewrite.")

for markup in (
    '<div class="brand-mark" aria-label="Bilocost">B</div>',
    '<div class="brand-mark large" aria-label="Bilocost">B</div>',
    '<div class="brand-mark hero" aria-label="Bilocost">B</div>',
):
    if markup not in html:
        raise SystemExit("Expected B placeholder markup was not found; refusing unsafe rewrite.")
    html = html.replace(markup, "", 1)

if "brand-mark" in html:
    raise SystemExit("Unexpected brand-mark reference remains after cleanup.")

target.write_text(html, encoding="utf-8")
print("Removed all unwanted green B placeholders; the rest of the interface was left intact.")
