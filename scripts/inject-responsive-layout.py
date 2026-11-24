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
    html = html.replace(link + chr(92) + "n</head>", link + chr(10) + "</head>", 1)
    html = html.replace("</head>", link + chr(10) + "</head>", 1)

# Keep the complete product photo visible, including the gallery and catalogue.
photo_rule = ".ph img, .gal img, .card img { object-fit:contain;background:var(--panel); }"
if photo_rule not in html:
    if "</style>" not in html:
        raise SystemExit("Inline stylesheet closing tag not found")
    html = html.replace(photo_rule + chr(92) + "n</style>", photo_rule + chr(10) + "</style>", 1)
    html = html.replace("</style>", photo_rule + chr(10) + "</style>", 1)

html_path.write_text(html, encoding="utf-8")
print("Responsive tablet/desktop stylesheet linked; product photos preserve their full aspect ratio.")
