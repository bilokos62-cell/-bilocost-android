from pathlib import Path
import re

html_path = Path("index.html")
css_path = Path("responsive-layout.css")
if not html_path.is_file() or not css_path.is_file():
    raise SystemExit("Responsive layout source files are missing")

html = html_path.read_text(encoding="utf-8")

# Remove a literal backslash-n immediately after BODY, including whitespace.
html = re.sub(r"(<body\b[^>]*>\s*)\\n", r"\1", html, count=1, flags=re.IGNORECASE)

# Version the stylesheet URL so browsers cannot reuse an older cached copy.
version = "20261124-2310"
link = f'<link rel="stylesheet" href="responsive-layout.css?v={version}">'
html = re.sub(r'<link rel="stylesheet" href="responsive-layout\.css(?:\?[^"]*)?">', link, html, count=1)
if link not in html:
    if "</head>" not in html:
        raise SystemExit("HTML head closing tag not found")
    html = html.replace("</head>", link + chr(10) + "</head>", 1)

photo_rule = ".ph img, .gal img, .card img { object-fit:contain;background:var(--panel); }"
if photo_rule not in html:
    if "</style>" not in html:
        raise SystemExit("Inline stylesheet closing tag not found")
    html = html.replace("</style>", photo_rule + chr(10) + "</style>", 1)

html_path.write_text(html, encoding="utf-8")
print("Responsive stylesheet cache-busted; literal newline artifact removed; product photos preserve full aspect ratio.")
