"""Bundle dist/tos into one self-contained HTML body (for sharing as a single page).
Usage: python3 tools/build-single.py OUT.html"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'tos'
html = (root / 'index.html').read_text()
css = (root / 'css' / 'app.css').read_text()
body = re.search(r'<body>(.*?)<script', html, re.S).group(1)
scripts = re.findall(r'<script src="([^"]+)"></script>', html)
js = '\n'.join(f'<script>\n{(root / s).read_text()}\n</script>' for s in scripts)
fonts = re.search(r'<link rel="stylesheet" href="(https://fonts[^"]+)">', html).group(1)
out = f'''<title>TOS III Study Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{fonts}">
<style>
{css}
</style>
{body}
{js}
'''
pathlib.Path(sys.argv[1]).write_text(out)
print('wrote', sys.argv[1], len(out), 'bytes')
