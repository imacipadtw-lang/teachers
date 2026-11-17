#!/usr/bin/env python3
"""Printable backup cards for the lesson (word+picture cards, picture-only cards, word-only cards) as an A4 PDF.
Uses the transparent food photos in photos-src/ and the word list in app.html (DEFAULT_WORDS)."""
import os, re, sys
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), 'Lunch_Box_Lab_Cards_printable.pdf')
pdfmetrics.registerFont(TTFont('ZH', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))

src = open(os.path.join(HERE, 'app.html'), encoding='utf-8').read()
blk = src[src.index('const DEFAULT_WORDS=['):]
blk = blk[:blk.index('];')]
WORDS = []
for m in re.finditer(r"\{pic:'[^']*',en:'([^']+)',zh:'([^']*)',count:(true|false),pl:'([^']*)'\}", blk):
    en, zh, count, pl = m.group(1), m.group(2), m.group(3) == 'true', m.group(4)
    key = {'noodle': 'noodles', 'dumpling': 'dumplings'}.get(en, en)
    WORDS.append(dict(en=en, zh=zh, count=count, form=(pl or en + 's') if count else en, key=key))

_cache = {}
def photo(key):
    if key not in _cache:
        im = Image.open(os.path.join(HERE, 'photos-src', key + '.png')).convert('RGBA')
        bbox = im.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
        if bbox:
            im = im.crop(bbox)
        im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
        # cards are printed on white paper: flatten onto white and embed as JPEG (keeps the PDF small enough to send by chat)
        flat = Image.new('RGB', im.size, (255, 255, 255)); flat.paste(im, mask=im.getchannel('A'))
        import io
        buf = io.BytesIO(); flat.save(buf, 'JPEG', quality=90); buf.seek(0)
        _cache[key] = ImageReader(buf)
    return _cache[key]

def draw_photo(c, key, x, y, w, h):
    r = photo(key)
    iw, ih = r.getSize()
    s = min(w / iw, h / ih)
    c.drawImage(r, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s)

def cutbox(c, x, y, w, h):
    c.saveState(); c.setStrokeColorRGB(.6, .6, .6); c.setDash(2, 2); c.setLineWidth(.6)
    c.roundRect(x, y, w, h, 3 * mm); c.restoreState()

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Ankita's Lunch Box — printable cards")
PW, PH = A4

def header(title, sub):
    c.setFont('Helvetica-Bold', 11); c.setFillColorRGB(.1, .16, .13)
    c.drawString(15 * mm, PH - 10 * mm, "Ankita's Lunch Box  ·  " + title)
    c.setFont('ZH', 8.5); c.setFillColorRGB(.4, .4, .4)
    c.drawString(15 * mm, PH - 14.5 * mm, sub)

# ---- word + picture cards: 2 x 4 per page, 90 x 64 mm
CW, CH = 90 * mm, 64 * mm
def word_card(w, x, y):
    cutbox(c, x, y, CW, CH)
    draw_photo(c, w['key'], x + 4 * mm, y + 14 * mm, 40 * mm, 46 * mm)
    c.setFillColorRGB(.1, .16, .13)
    size = 22 if len(w['en']) <= 7 else 18 if len(w['en']) <= 9 else 15
    c.setFont('Helvetica-Bold', size); c.drawString(x + 47 * mm, y + CH - 18 * mm, w['en'])
    c.setFont('ZH', 11); c.setFillColorRGB(.35, .35, .35); c.drawString(x + 47 * mm, y + CH - 25 * mm, w['zh'])
    c.setFont('Helvetica', 8.5)
    if w['count']:
        c.setFillColorRGB(.18, .49, .31); c.drawString(x + 47 * mm, y + CH - 33 * mm, 'countable  →  ' + w['form'])
    else:
        c.setFillColorRGB(.7, .23, .16); c.drawString(x + 47 * mm, y + CH - 33 * mm, 'uncountable: no a, no -s')
    c.setFillColorRGB(.1, .16, .13); c.setFont('Helvetica', 8)
    c.drawString(x + 47 * mm, y + CH - 41 * mm, f"I like {w['form']}.")
    c.drawString(x + 47 * mm, y + CH - 46 * mm, f"I want some {w['form']}.")
    c.setFont('Helvetica-Oblique', 7); c.setFillColorRGB(.5, .5, .5)
    c.drawString(x + 4 * mm, y + 5 * mm, 'Say the word, then both sentences.')

per = 8
for pi in range(0, len(WORDS), per):
    header('word + picture cards (cut along the dotted lines)', '單字＋圖片卡：沿虛線剪下。可數用複數，不可數不加 a、不加 -s。')
    for i, w in enumerate(WORDS[pi:pi + per]):
        col, row = i % 2, i // 2
        word_card(w, 15 * mm + col * CW, PH - 20 * mm - (row + 1) * CH - row * 3 * mm)
    c.showPage()

# ---- picture-only cards: 3 x 5 per page (55 x 52 mm)
PWd, PHt = 56 * mm, 52 * mm
def grid(items, draw, title, sub):
    per = 15
    for pi in range(0, len(items), per):
        header(title, sub)
        for i, it in enumerate(items[pi:pi + per]):
            col, row = i % 3, i // 3
            x = 15 * mm + col * (PWd + 3 * mm); y = PH - 20 * mm - (row + 1) * PHt - row * 3 * mm
            cutbox(c, x, y, PWd, PHt); draw(it, x, y)
        c.showPage()

def picture_only(w, x, y):
    draw_photo(c, w['key'], x + 4 * mm, y + 4 * mm, PWd - 8 * mm, PHt - 8 * mm)

def word_only(w, x, y):
    c.setFillColorRGB(.1, .16, .13)
    size = 24 if len(w['en']) <= 7 else 19 if len(w['en']) <= 9 else 15
    c.setFont('Helvetica-Bold', size); c.drawCentredString(x + PWd / 2, y + PHt / 2 + 2 * mm, w['en'])
    c.setFont('ZH', 11); c.setFillColorRGB(.4, .4, .4); c.drawCentredString(x + PWd / 2, y + PHt / 2 - 7 * mm, w['zh'])

grid(WORDS, picture_only, 'picture-only cards', '圖片卡：學生看圖說出單字與句子（I like ___. / I want some ___.）。')
grid(WORDS, word_only, 'word-only cards', '字卡：只有單字，用來自我檢核 ✓ △ ? 或配對圖片卡。')

c.save()
print('saved', OUT, len(WORDS), 'words')
