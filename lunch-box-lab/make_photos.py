#!/usr/bin/env python3
"""Turn the Canva-generated, background-removed food photos in photos-src/ into compact WebP data URIs
(photos.js -> window.LBL_PHOTOS), used by the app as the default picture style.

  python3 make_photos.py           # rebuild photos.js from photos-src/*.png
Images are AI-generated stand-ins for real food photos (Canva generate-image + remove-background), 200x200 originals.
"""
import base64, glob, io, json, os
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'photos-src')
SIZE = 256


def process(path):
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A')
    bbox = a.point(lambda v: 255 if v > 12 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = int(max(w, h) * 1.06)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2))
    sq = sq.resize((SIZE, SIZE), Image.LANCZOS)
    # gentle sharpening to hide the upscale softness; keep alpha untouched
    rgb = sq.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    out = Image.merge('RGBA', (*rgb.split(), sq.getchannel('A')))
    buf = io.BytesIO()
    out.save(buf, 'WEBP', quality=86, method=6)
    return buf.getvalue()


def main():
    photos = {}
    for f in sorted(glob.glob(os.path.join(SRC, '*.png'))):
        key = os.path.splitext(os.path.basename(f))[0]
        data = process(f)
        photos[key] = 'data:image/webp;base64,' + base64.b64encode(data).decode()
        print(f'{key:12s} {len(data)/1024:5.1f} KB')
    open(os.path.join(HERE, 'photos.js'), 'w', encoding='utf-8').write('window.LBL_PHOTOS=' + json.dumps(photos) + ';')
    print('total', len(photos), 'photos')


if __name__ == '__main__':
    main()
