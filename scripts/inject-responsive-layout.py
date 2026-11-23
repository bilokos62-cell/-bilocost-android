from pathlib import Path

html_path = Path("index.html")
css_path = Path("responsive-layout.css")
if not html_path.is_file() or not css_path.is_file():
    raise SystemExit("Responsive layout source files are missing")

html = html_path.read_text(encoding="utf-8")
link = '<link rel="stylesheet" href="responsive-layout.css">'
if link not in html:
    if "</head>" not in html:
        raise SystemExit("HTML head closing tag not found")
    html = html.replace("</head>", link + "\n</head>", 1)
html_path.write_text(html, encoding="utf-8")
print("Responsive tablet/desktop stylesheet linked.")
