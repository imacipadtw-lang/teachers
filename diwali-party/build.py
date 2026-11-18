#!/usr/bin/env python3
"""Build class.html (the class deck) from class.src.html.

The deck borrows three things from ../lunch-box-lab so the children see the same friends on the big screen and on
their iPads: the mascot Boxy (anime.css + the SVG inside anime.js), the clay food characters (chars.js) and the food
photos (embedded in ../lunch-box-lab/index.html). Run this again after Lunch Box Lab changes any of them.
"""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__))
lab = os.path.join(os.path.dirname(here), 'lunch-box-lab')
rd = lambda p: open(p, encoding='utf-8').read()
src = rd(os.path.join(here, 'class.src.html'))
anime_js = rd(os.path.join(lab, 'anime.js'))
i = anime_js.index('const SVG = `') + len('const SVG = `'); boxy = anime_js[i:anime_js.index('`;', i)]
assert boxy.startswith('<svg') and boxy.rstrip().endswith('</svg>')
m = re.search(r'window\.LBL_PHOTOS=(\{.*?\});?\s*\n', rd(os.path.join(lab, 'index.html')))
photos = json.loads(m.group(1))
need = ['naan', 'curry', 'samosa', 'apple', 'dumplings', 'rice']
missing = [k for k in need if k not in photos]; assert not missing, missing
parts = {
    '/*{{ANIME_CSS}}*/': rd(os.path.join(lab, 'anime.css')),
    '<!--{{BOXY_SVG}}-->': boxy,
    '/*{{CHARS_JS}}*/': rd(os.path.join(lab, 'chars.js')),
    '/*{{PHOTOS}}*/{}': json.dumps({k: photos[k] for k in need}),
}
for k, v in parts.items():
    assert src.count(k) == 1, k
    assert '</script' not in v.lower() and '</style' not in v.lower(), k
    src = src.replace(k, v)
open(os.path.join(here, 'class.html'), 'w', encoding='utf-8').write(src)
print('built class.html', len(src), 'bytes')
