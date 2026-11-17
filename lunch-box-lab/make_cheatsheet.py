#!/usr/bin/env python3
"""One-page English cheat sheet for the lead teacher (A4): the 40 minutes at a glance, key sentences, the grammar rule, gestures."""
import os, sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), 'Ankita_Lesson_Cheat_Sheet_1page.pdf')
pdfmetrics.registerFont(TTFont('ZH', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
D = '/usr/share/fonts/truetype/dejavu/'
for n, f in [('DV', 'DejaVuSans.ttf'), ('DV-B', 'DejaVuSans-Bold.ttf'), ('DV-I', 'DejaVuSans.ttf'), ('DV-BI', 'DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(n, D + f))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily('DV', normal='DV', bold='DV-B', italic='DV-I', boldItalic='DV-BI')

INK = colors.HexColor('#1D2A22'); RED = colors.HexColor('#B23A28'); GREEN = colors.HexColor('#2E7D50'); MUTED = colors.HexColor('#56665C')
LINE = colors.HexColor('#C9D2C5'); SOFT = colors.HexColor('#F1F4EE'); EGG = colors.HexColor('#EFB024')

body = ParagraphStyle('b', fontName='DV', fontSize=9.7, leading=13.6, textColor=INK)
bold = ParagraphStyle('bb', parent=body, fontName='DV-B')
say = ParagraphStyle('s', parent=body, fontName='DV-I', textColor=colors.HexColor('#2A3F33'))
small = ParagraphStyle('sm', parent=body, fontSize=7.6, leading=9.6, textColor=MUTED)
zh = ParagraphStyle('zh', parent=body, fontName='ZH', fontSize=8, leading=10.5, textColor=MUTED)

c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Ankita's Lunch Box — 40-minute cheat sheet")
PW, PH = A4
M = 12 * mm

# header band
c.setFillColor(RED); c.rect(0, PH - 22 * mm, PW, 22 * mm, stroke=0, fill=1)
c.setFillColor(colors.white); c.setFont('DV-B', 17); c.drawString(M, PH - 11 * mm, "Ankita's Lunch Box")
c.setFont('DV', 8.6); c.drawString(M, PH - 17 * mm, 'Grade 5A · 40 minutes · I like ___. / I want some ___.  ·  28 Dec 2026')
c.setFont('ZH', 8.5); c.drawRightString(PW - M, PH - 11 * mm, '五甲英語・公開觀課')
c.drawRightString(PW - M, PH - 17 * mm, '一頁速查卡（講師用）')

rows = [
 ['0–5', 'Hook &\ngoal',
  [Paragraph('“Last week was the winter solstice. You ate <b>tangyuan</b>! In India, at <b>Diwali</b>, I eat sweets. Let’s open my lunch box!”', say),
   Paragraph('Show naan · curry · samosas → say each word <b>twice</b>, class repeats. “Show me: ✓ thumb up, △ flat hand, ? question mark.”', body)],
  [Paragraph('Write the <b>?</b> words on the board = <b>goal words</b>. Each student circles one.', body)]],
 ['5–13', 'Self-\nstudy',
  [Paragraph('“Choose one way to practise. <b>Start with your goal word.</b> Eight minutes.”', say),
   Paragraph('① Catch (listen & tap) ② Pack the Box (sentence → lunch box) ③ Build It ④ Cards', body)],
  [Paragraph('Walk round. Ask two students: “Why did you choose this way?” Support the <b>?</b> students first.', body)]],
 ['13–16', 'Pair\ncheck',
  [Paragraph('“Partner check! Test your partner on three words. ✓ △ or ?”', say)],
  [Paragraph('Model once with a student. Replay the two hardest words (slow replay), both frames.', body)]],
 ['16–26', 'Group\nmenu',
  [Paragraph('“<b>Apples</b> — can you count them? Yes → -s.  <b>Rice</b> — can you count it? No → no a, no -s.”', say),
   Paragraph('Step 1 <b>Say</b> (2 sentences each) → Step 2 <b>Cross-check</b>: A→B, B→C, C→A → Step 3 <b>Build</b> the 4-sentence menu.', body)],
  [Paragraph('Count on fingers (countable) / pile gesture (uncountable). Checkers <b>circle, never correct</b>. One India + one Taiwan food.', body)]],
 ['26–34', 'Reports',
  [Paragraph('“Group A, share your four sentences. Group B, listen and check: can you understand? Are -s and a correct?”', say),
   Paragraph('“<b>One star and one tip</b>, please.”  Frames: “I like your sentence about ___.” / “Please check ___.”', body)],
  [Paragraph('Draw a seat number first. Fix one sentence from the tip and say it again.', body)]],
 ['34–40', 'Impostor\n& exit',
  [Paragraph('“One word is the <b>impostor</b>. Find it! Is it <b>a</b>, or is it <b>-s</b>?”  (I like <i>a</i> rice. / I want some <i>apple</i>.)', say),
   Paragraph('“Look at our goal words again: ✓ △ ?  — <b>We had 5 question marks. Now we have 2. Great job!</b>”', say)],
  [Paragraph('Exit check (6 questions) + result card. Last line: “Tell your partner one word you will practise next time.”', body)]],
]
hdr = [Paragraph('<b>min</b>', small), Paragraph('<b>Stage</b>', small), Paragraph('<b>Say</b>', small), Paragraph('<b>Do</b>', small)]
data = [hdr]
for t, stage, sayp, dop in rows:
    data.append([Paragraph(f'<b>{t}</b>', bold), Paragraph('<b>' + stage.replace('\n', '<br/>') + '</b>', body), sayp, dop])
tbl = Table(data, colWidths=[17 * mm, 25 * mm, 95 * mm, 49 * mm])
tbl.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), SOFT), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LINEBELOW', (0, 0), (-1, -1), .5, LINE), ('BOX', (0, 0), (-1, -1), .8, INK),
    ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4), ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ('BACKGROUND', (0, 1), (1, -1), colors.HexColor('#FBF3DC')),
]))
w, h = tbl.wrapOn(c, PW - 2 * M, 200 * mm)
y = PH - 27 * mm - h
tbl.drawOn(c, M, y)

# rule box
y -= 6 * mm
bw = (PW - 2 * M - 5 * mm) / 2
def box(x, yy, ww, hh, title, color):
    c.setStrokeColor(color); c.setLineWidth(1.4); c.roundRect(x, yy, ww, hh, 3 * mm, stroke=1, fill=0)
    c.setFillColor(color); c.setFont('DV-B', 9.5); c.drawString(x + 4 * mm, yy + hh - 5.5 * mm, title)
hh = 50 * mm
box(M, y - hh, bw, hh, 'The rule', GREEN)
p1 = Paragraph('<font color="#2E7D50"><b>Countable → -s</b></font>: apples, eggs, hamburgers, dumplings, noodles, samosas.<br/><font color="#B23A28"><b>Uncountable → no a, no -s</b></font>: rice, cream, cake, fish, chicken, naan, curry.<br/><br/>Students’ usual mistakes: <i>I like a rice.</i> · <i>I like apple.</i><br/>Never correct directly — point to the checklist or ask: “Can you count it?”', body)
pw, ph = p1.wrapOn(c, bw - 8 * mm, hh); p1.drawOn(c, M + 4 * mm, y - 9 * mm - ph)
box(M + bw + 5 * mm, y - hh, bw, hh, 'Handy classroom English', RED)
p2 = Paragraph('“Say it with me.” · “Your turn.” · “Work with your partner.” · “Show me ✓ △ ?” · “Listen and point.” · “Who has the Chef / Checker / Reporter?” · “Great job!” · “Try again.” · “Let’s check with the app.” (co-teacher takes the screen) · “Back to Teacher Ankita.”', body)
pw, ph = p2.wrapOn(c, bw - 8 * mm, hh); p2.drawOn(c, M + bw + 9 * mm, y - 9 * mm - ph)

# footer: time control + backups
y -= hh + 5 * mm
p3 = Paragraph('<b>If you run late, cut in this order:</b> second self-study round → reports shorten to 2 sentences per group → 2 impostor sentences instead of 3. <b>Never cut:</b> goal words · cross-check · exit check · the before/after ✓ △ ? count (the learning evidence).<br/><b>No tablets or Wi-Fi?</b> Everything works with the printed word / picture cards, the board, and hand signals. <b>Roles:</b> Group A = seats 1, 3, 5 · Group B = seats 2, 4, 6 · Chef · Checker · Reporter.', body)
pw, ph = p3.wrapOn(c, PW - 2 * M, 60 * mm); p3.drawOn(c, M, y - ph)
c.setFont('ZH', 7.5); c.setFillColor(MUTED)
c.drawString(M, 9 * mm, '完整腳本見教案附件 2A；程式網址：claude.ai/artifact/5CrCV1GGNXaZYRqdmocLRZ（教師工具有 QR code）')
c.save(); print('saved', OUT)
