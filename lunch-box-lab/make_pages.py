#!/usr/bin/env python3
"""Wrap the built single-file app (build.py output) into a complete, standalone web page for GitHub Pages.

  python3 make_pages.py OUT.html [BUILT.html]

The Claude preview page gets its <!doctype>/<head> from the platform; for a normal host we add the same wrapper
(same base CSS) plus a noindex meta so the lesson tool is not listed by search engines.
"""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'index.html')
built = sys.argv[2] if len(sys.argv) > 2 else (os.environ.get('LBL_OUT') or os.path.join(os.path.dirname(here), 'lunch-box-lab.html'))
body = open(built, encoding='utf-8').read()
head = ('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="robots" content="noindex,nofollow,noai,noimageai">'
        '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
        'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n')
open(out, 'w', encoding='utf-8').write(head + body.rstrip('\n') + '\n</body></html>\n')
print('pages', out, len(head) + len(body), 'bytes')
