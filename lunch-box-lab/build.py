"""Build lunch-box-lab.html: app.html + embedded ElevenLabs clips (clips-*.js)."""
import glob, os
here = os.path.dirname(os.path.abspath(__file__))
app = open(os.path.join(here, 'app.html'), encoding='utf-8').read()
parts = [open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(here, 'clips-*.js')))]
# each clips file assigns into window.LBL_CLIPS (merge-safe)
chars = open(os.path.join(here, 'chars.js'), encoding='utf-8').read()
photos = open(os.path.join(here, 'photos.js'), encoding='utf-8').read() if os.path.exists(os.path.join(here, 'photos.js')) else 'window.LBL_PHOTOS={};'
block = '<script>/* original clay-style food characters (SVG) */\n' + chars + '\n</script>\n<script>/* food photos (AI-generated, transparent, WebP) */\n' + photos + '\n</script>\n<script>/* ElevenLabs recordings (voice: Bella, eleven_v4) */\nwindow.LBL_CLIPS=window.LBL_CLIPS||{};\n' + '\n'.join(parts) + '</script>'
assert app.count('<!--CLIPS-->') == 1
out = app.replace('<!--CLIPS-->', block)
# QR code for the app link (generated once with the python qrcode package into qr.svg)
qr = open(os.path.join(here, 'qr.svg'), encoding='utf-8').read()
qr = qr[qr.index('<svg'):]
if '<!--ANIME-->' in out:   # anime layer: mascot + manga-style effects (anime.css / anime.js)
    css = open(os.path.join(here, 'anime.css'), encoding='utf-8').read()
    js = open(os.path.join(here, 'anime.js'), encoding='utf-8').read()
    out = out.replace('<!--ANIME-->', '<style>/* anime layer */\n' + css + '</style>\n<script>' + js + '</script>')
assert out.count('<!--QR-->') == 1
out = out.replace('<!--QR-->', qr)
dest = os.environ.get('LBL_OUT') or os.path.join(os.path.dirname(here), 'lunch-box-lab.html')
open(dest, 'w', encoding='utf-8').write(out)
print('built', len(out), 'bytes ->', dest)
