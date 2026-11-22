#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build script.html (the teaching script) from lines.json.

lines.json is the single source of truth for every English line and for the
audio file name (voice/<id>.mp3). The classroom choreography — which key to
press on the deck, what the students do, what Ankita says — lives in STEPS
below, keyed to the same line ids, so a line can never drift away from its
recording.

    python3 make_script.py        # writes script.html

After editing an English line in lines.json, re-record it (see make_voice.py)
and run this again.
"""
import json, os, re, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
VERSION = "2026.11.22a"

# ---------------------------------------------------------------- choreography
# Each tab: id, label (tab text), kicker (time), title, note, and a list of
# rows. A row is either ("say", line_id) — spoken by me, with audio — or
# (kind, text) where kind is key / do / st / ank / tip.
STEPS = [
 dict(id="pre", label="課前", kicker="12/28 之前", title="照順序打勾", note="全部打完勾，當天只要照著後面的分頁走。",
   rows=[
    ("chk", "<b>先上一節 20 分鐘「iPad 練習課」</b>：不教新單字，只練五個動作——掃 QR 開學生入口、按 1／2／3、Wordwall 拖曳、Padlet 按 ＋ 錄音、按左上角 &lt; 回來。"),
    ("chk", "做好 Wordwall 與 Padlet（做法在 <a href=\"plan.html\">教案</a>「課前準備」），把兩個連結貼到 <a href=\"./#setup\">入口頁「老師設定」</a>，按儲存。"),
    ("chk", "六台 iPad 掃入口頁 QR code，看得到 1、2、3 三個大按鈕。在 Padlet 按一次錄音讓 iPad 先允許麥克風。側邊靜音關掉、音量開大。"),
    ("chk", "大螢幕用 Chrome 或 Edge 開 <a href=\"class.html\">上課簡報</a>，按 <kbd>F</kbd> 全螢幕，停在第 1 頁先點一下畫面。另開一個分頁登入 Wordwall 的「結果」頁。"),
    ("chk", "Spin 畫面按「🆕 新的一節課」兩下清掉舊紀錄；有人請假，到 Lunch Box Lab「教師工具」點掉座號。"),
    ("chk", "和 Ankita 對好：她講到 20:00，交棒句 <i>What food should we bring to the party?</i>；後 20 分鐘她當派對主人、發音示範、裁判。"),
    ("tip", "這一節全英語。每一句都配一個固定動作，孩子看動作就懂；真的卡住就慢慢再說一次＋做動作＋指螢幕，說 <i>Watch me.</i> 直接示範。"),
   ]),
 dict(id="core", label="口令", kicker="整節課", title="一直重複的 22 句", note="每一句按 ▶ 聽一次、跟著唸一次。這 22 句練熟，整節課就夠用。", core=True, rows=[]),
 dict(id="s0", label="0:00 外師", kicker="0:00–20:00", title="Ankita 主教，我協助", note="她的簡報第 1–24 頁。我不翻譯。",
   rows=[
    ("do", "站在學生側後方：幫忙換頁、遞實物。孩子聽不懂時用動作、指圖片。記下兩位最需要幫忙的孩子。"),
    ("do", "<b>18:00</b> 向 Ankita 比「2」（還有兩分鐘）。<b>19:30</b> 把大螢幕換到上課簡報第 1 頁。"),
    ("ank", "What food should we bring to the party?"),
   ]),
 dict(id="s1", label="20:00 接棒", kicker="20:00", title="任務與三個 I can", note="簡報第 1、2 頁・45 秒",
   rows=[
    ("key", "第 1 頁<b>按一下</b>：出現問句。"),
    ("say", "a01"),
    ("key", "<b>按一下</b>到第 2 頁，再<b>按三下</b>，一次出現一張卡。"),
    ("say", "a02"), ("say", "a03"), ("say", "a04"), ("say", "a05"),
    ("tip", "每出現一張卡，指著大字帶全班唸一次。"),
   ]),
 dict(id="s2", label="20:45 Spin", kicker="20:45", title="導學｜Cool English 單字＋Spin", note="第 3 頁・到 22:00",
   rows=[
    ("key", "<b>按一下</b>到第 3 頁（畫面寫 Words from Cool English），再<b>按一下</b>：出現 ✔ △ ?。"),
    ("say", "b01"),
    ("tip", "指著畫面那一行說一次就好，不用切到酷英網。"),
    ("say", "b02"),
    ("tip", "邊說邊做三個手勢，孩子跟著做一次。"),
    ("say", "b03"),
    ("key", "<b>按一下</b>，再<b>按一下</b>：Spin 在簡報裡打開。"),
    ("say", "b04"), ("say", "b05"),
    ("do", "轉 3–4 個字，每個字都是同樣這幾句。看多數人的手勢按 ✔ △ ?（鍵盤 <kbd>3</kbd> <kbd>2</kbd> <kbd>1</kbd>）。"),
    ("ank", "Say it with me.（第二次唸由她帶）"),
    ("key", "22:00 按右下角「下一頁 →」。"),
   ]),
 dict(id="s3", label="22:00 Wordwall", kicker="22:00", title="自學｜Wordwall 配對", note="第 4 頁・每人一台 iPad・倒數 3:30",
   rows=[
    ("key", "<b>按一下</b>：出現四個步驟和「▶ Watch me first」。"),
    ("say", "d01"),
    ("do", "點「▶ Watch me first」，Wordwall 在新分頁打開。示範一題。"),
    ("say", "d02"),
    ("do", "切回簡報分頁。"),
    ("say", "d03"), ("say", "d04"),
    ("key", "再<b>按一下</b>：出現 GO!，計時開始。"),
    ("say", "d05"),
    ("st", "按入口的 <b>1</b> → 輸入座號 → 把單字拖到對的圖片上。點單字會唸出英文。"),
    ("do", "先走到那兩位孩子旁邊，手指點螢幕示範，不替他做。看 Wordwall 結果頁，記下錯最多的一個字。"),
    ("ank", "Say it with me.（蹲到孩子旁邊聽他唸、再示範）"),
    ("say", "d06"), ("say", "d07"), ("say", "d08"),
    ("tip", "把錯最多的那個字唸兩次（上面用 noodles 當例子）。這 20 秒就是「依評量結果給回饋」。"),
   ]),
 dict(id="s4", label="26:00 Menu", kicker="26:00", title="共學｜Party Menu", note="第 5 頁・一組一台 iPad・倒數 3:30",
   rows=[
    ("key", "<b>按一下</b>換到第 5 頁。再<b>按一下</b>：規則。再<b>按一下</b>：三個角色。"),
    ("say", "e01"), ("say", "e02"),
    ("tip", "比 3，再比 1，指著 naan、curry、samosa 的圖。"),
    ("say", "e03"), ("say", "e04"), ("say", "e05"),
    ("key", "再<b>按一下</b>：GO!，計時開始。"),
    ("st", "Leader 按入口的 <b>2</b>，三人各選一種食物，再一起選對的句子。Reporter 帶全組把菜單唸一次。"),
    ("say", "e06"),
    ("tip", "選錯時不給答案，只問這一句，指著畫面。答對說 <i>Nice job!</i>"),
    ("ank", "What food is from India? … Yes! I love samosas!"),
    ("say", "e07"),
   ]),
 dict(id="s5", label="30:00 Padlet", kicker="30:00", title="互學｜Padlet 錄音互評", note="第 6 頁・倒數 2:30",
   rows=[
    ("key", "<b>按一下</b>換到第 6 頁，再<b>按一下</b>：Team A 的句子、「▶ Open Padlet」，GO! 計時 2:30。"),
    ("say", "f01"),
    ("do", "點「▶ Open Padlet」，邊做邊說下一句的五個步驟。"),
    ("say", "f02"), ("say", "f03"),
    ("st", "每組在自己那一欄按 ＋ → 錄音 → 三人輪流說 <i>I want some ___.</i> → 發布。"),
    ("key", "<b>按一下</b>：Team B 的回應句。"),
    ("say", "f04"),
    ("do", "在大螢幕的 Padlet 播放 A 組的錄音。"),
    ("say", "f05"),
    ("key", "<b>按一下</b>：Checker 的問題。"),
    ("say", "f06"), ("say", "f07"),
    ("tip", "有錯才說 <i>Fix it, and record it again.</i>——這就是「依它組意見修改」。沒錯就給一個 👍。"),
    ("say", "f08"),
    ("ank", "Thank you!（每組聽完說一次）"),
   ]),
 dict(id="s6", label="33:00 Count it", kicker="33:00", title="導學｜Can you count it?＋Impostor", note="第 7 頁・2 分鐘",
   rows=[
    ("key", "<b>按一下</b>換到第 7 頁，再<b>按一下</b>：YES 那一欄。"),
    ("say", "g01"),
    ("key", "再<b>按一下</b>：NO 那一欄。"),
    ("say", "g02"), ("say", "g03"),
    ("tip", "規則唸兩次，讓孩子自己說出來。"),
    ("key", "<b>按兩下</b>：Impostor 在簡報裡打開。"),
    ("say", "g04"),
    ("do", "孩子指出來，我點那個字；整句都對就按「沒有內鬼」。抓 2 句。"),
    ("ank", "把畫面上的句子照唸（錯的也照唸）。"),
    ("key", "35:00 按「下一頁 →」。"),
   ]),
 dict(id="s7", label="35:00 Speed", kicker="35:00", title="統整｜Speed Round", note="第 8 頁・到 38:30・每個人至少開口一次",
   rows=[
    ("key", "<b>按一下</b>：兩隊。再<b>按一下</b>：規則。再<b>按兩下</b>：Speed Round 在簡報裡打開。"),
    ("say", "h01"), ("say", "h02"), ("say", "h03"), ("say", "h04"),
    ("do", "按「🎲 抽一位」（空白鍵）→ 唸座號 → 說對按 ✓（<kbd>1</kbd>），沒說出來按 ✗（<kbd>2</kbd>）。"),
    ("say", "h05"), ("say", "h06"), ("say", "h07"),
    ("ank", "當裁判，重複正確句子：I want some samosas. Great!"),
    ("say", "h08"),
    ("key", "38:30 按「下一頁 →」。"),
   ]),
 dict(id="s8", label="38:30 結尾", kicker="38:30", title="自我檢核與離場句", note="第 9、10 頁・90 秒・離場句不能省",
   rows=[
    ("key", "第 9 頁<b>按三下</b>，一次一張卡。"),
    ("say", "i01"), ("say", "i02"), ("say", "i03"), ("say", "i04"),
    ("key", "<b>按一下</b>到第 10 頁，再<b>按兩下</b>：出現兩句對話。"),
    ("say", "i05"),
    ("st", "I want some ___!（每個人對 Ankita 說一句）"),
    ("ank", "Here you are! Happy Diwali!（和每個孩子擊掌）"),
    ("key", "再<b>按兩下</b>：回家任務和煙火。"),
    ("say", "i06"),
   ]),
 dict(id="after", label="課後／省時", kicker="下課後", title="課後 5 分鐘與省時順序", note="學生不用操作。",
   rows=[
    ("chk", "把上課簡報、Wordwall、Padlet 三個連結和 Wordwall 成績截圖放到<b>因材網</b>老師教材區，當作這一課的數位教材與學習紀錄。"),
    ("chk", "在 Lunch Box Lab「學習證據」看課前、課後的 ✔ △ ? 與每人開口次數，帶到議課。"),
    ("h", "時間不夠時，照這個順序省"),
    ("num", "1｜<b>Spin</b> 只轉 2 個字。"),
    ("num", "2｜<b>Padlet</b> 只錄 A 組，B 組直接口頭說菜單。"),
    ("num", "3｜<b>Impostor</b> 只抓 1 句。"),
    ("num", "4｜<b>自我檢核</b> 只做 Number two。"),
    ("tip", "<b>不能省</b>：離場句。每人對 Ankita 說一句 <i>I want some ___.</i>"),
   ]),
 dict(id="fix", label="應變", kicker="臨時狀況", title="出狀況就看這一頁", note="先處理孩子，不要停下來修機器。",
   rows=[
    ("two", "孩子聽不懂指令|慢慢再說一次＋做動作＋指螢幕；說 <i>Watch me.</i> 直接示範。"),
    ("two", "Padlet 不能錄音|全組對著大螢幕直接說，我按 👍；課後再補錄。"),
    ("two", "Wordwall 打不開|在大螢幕全班一起玩：我拖、孩子說，再進 Party Menu。"),
    ("two", "某台 iPad 沒聲音|看側邊靜音與音量；不行就和旁邊同學共用。"),
    ("two", "孩子回不到學生入口|按 Safari 左上角的 &lt;；還是不行重新掃 QR code。"),
    ("two", "Speed Round 說不出來|10 秒到全班一起唸，按 ✗ 再練，說 <i>Great try!</i>"),
    ("two", "簡報按太快|點畫面最左邊或按 <kbd>←</kbd>；數字鍵 <kbd>1</kbd>–<kbd>9</kbd>、<kbd>0</kbd> 跳頁。"),
    ("two", "孩子吵|按 <kbd>B</kbd> 出現 Eyes on me! 大畫面，等安靜再按一下回來。"),
   ]),
 dict(id="ank", label="Ankita", kicker="For Ankita", title="Your lines after 20:00", note="You lead until 20:00. After that you are the party host. Short, slow sentences.", en=True,
   rows=[
    ("two", "20:00|What food should we bring to the party?"),
    ("two", "Spin|Lead the second repeat: Say it with me."),
    ("two", "Wordwall|Sit next to a child: Say it with me."),
    ("two", "Party Menu|What food is from India? → Yes! I love samosas!"),
    ("two", "Padlet|After each team's recording: Thank you!"),
    ("two", "Impostor|Read the sentence on the screen aloud, mistakes included."),
    ("two", "Speed Round|Judge. Repeat the correct sentence: I want some ___. Great!"),
    ("two", "At the door|Each child: I want some ___! You: Here you are! Happy Diwali!"),
   ]),
]

TAGS = {"key": ("按鍵", "k"), "do": ("我做", "d"), "st": ("學生", "s"), "ank": ("Ankita", "a"), "tip": ("提醒", "t")}


def build():
    L = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    by_id, group_of = {}, {}
    for g in L["groups"]:
        for x in g["lines"]:
            by_id[x["id"]] = x
            group_of[x["id"]] = g["id"]
    core = [x for g in L["groups"] if g["id"] == "core" for x in g["lines"]]

    def say(lid):
        x = by_id[lid]
        hint = x["zh"] + (("・" + x["do"]) if x.get("do") else "")
        return ('<div class="row say"><button class="play" data-a="%s" aria-label="播放 %s">▶</button>'
                '<div class="rt"><p class="en">%s</p><p class="zh">%s</p></div></div>'
                % (lid, html.escape(x["en"], True), html.escape(x["en"]), hint))

    def other(kind, text):
        if kind == "chk":
            return '<label class="row chk"><input type="checkbox"><span>%s</span></label>' % text
        if kind == "h":
            return '<h3 class="sub">%s</h3>' % text
        if kind == "num":
            return '<div class="row num"><span>%s</span></div>' % text
        if kind == "two":
            a, b = text.split("|", 1)
            return '<div class="row two"><b>%s</b><span>%s</span></div>' % (a, b)
        lab, cls = TAGS[kind]
        return ('<div class="row %s"><span class="tg">%s</span><div class="rt"><p>%s</p></div></div>'
                % (kind, lab, text))

    tabs, panels = [], []
    for i, s in enumerate(STEPS):
        tabs.append('<button class="tab" role="tab" id="tab-%s" aria-controls="p-%s" aria-selected="%s" data-p="%s">'
                    '<small>%s</small><b>%s</b></button>'
                    % (s["id"], s["id"], "true" if i == 0 else "false", s["id"],
                       html.escape(s["kicker"]), html.escape(s["label"])))
        body = []
        if s.get("core"):
            body.append('<div class="cards">')
            for x in core:
                body.append('<button class="card" data-a="%s"><span class="pl">▶</span>'
                            '<span class="ct"><b>%s</b><i>%s</i></span></button>'
                            % (x["id"], html.escape(x["en"]), html.escape(x["zh"])))
            body.append('</div>')
            body.append('<p class="foot">動作：' + '　'.join(
                '<span>%s<i>%s</i></span>' % (html.escape(x["en"]), html.escape(x["do"])) for x in core[:0]) + '</p>')
        else:
            body.append('<div class="rows">')
            for kind, text in s["rows"]:
                body.append(say(text) if kind == "say" else other(kind, text))
            body.append('</div>')
        said = [t for k, t in s["rows"] if k == "say"]
        allbtn = ('<button class="seq" data-seq="%s">▶ 播放這一段（%d 句）</button>' % (",".join(said), len(said))) if said else ""
        panels.append('<section class="panel%s" role="tabpanel" id="p-%s" aria-labelledby="tab-%s"%s>'
                      '<header class="ph"><div><h2>%s</h2><p>%s</p></div>%s</header>%s</section>'
                      % (" en" if s.get("en") else "", s["id"], s["id"], "" if i == 0 else " hidden",
                         html.escape(s["title"]), s["note"], allbtn,
                         '<div class="fit">' + "".join(body) + '</div>'))

    out = TPL.replace("{{TABS}}", "\n".join(tabs)).replace("{{PANELS}}", "\n".join(panels))
    out = out.replace("{{VER}}", VERSION).replace("{{N}}", str(len(by_id)))
    open(os.path.join(HERE, "script.html"), "w", encoding="utf-8").write(out)
    print("script.html  tabs=%d  lines=%d  %d bytes" % (len(STEPS), len(by_id), len(out)))


TPL = r"""<!doctype html>
<!-- 著作權所有 © 2026 imacipadtw-lang，保留一切權利。本檔公開可見不代表授權，見倉庫根目錄 LICENSE。 -->
<html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noai,noimageai">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>上課腳本｜Ankita's Diwali Party</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Noto+Sans+TC:wght@500;700;900&display=swap" media="print" onload="this.media='all'">
<style>
:root{color-scheme:dark;
 --night:#140E3F;--deep:#0C0828;--panel:#221A63;--card:#2B2176;--line:rgba(255,255,255,.14);
 --ink:#FFF7E6;--mut:#C6BCEF;--gold:#FFC531;--pink:#FF8AC0;--mint:#5FE6D2;--teal:#2EDCA4;
 --f:"Baloo 2","Noto Sans TC","PingFang TC",system-ui,sans-serif;
 --zh:"Noto Sans TC","PingFang TC",system-ui,sans-serif}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;overflow:hidden;color:var(--ink);font:500 16px/1.5 var(--zh);
 background:radial-gradient(900px 600px at 88% -5%,#4A34B8 0,transparent 62%),linear-gradient(165deg,#2A1E7A,var(--night) 55%,var(--deep));
 -webkit-tap-highlight-color:transparent}
.wrap{display:grid;grid-template-rows:auto auto minmax(0,1fr);height:100dvh;
 padding-left:max(10px,env(safe-area-inset-left,0px));padding-right:max(10px,env(safe-area-inset-right,0px));
 padding-top:max(8px,env(safe-area-inset-top,0px));padding-bottom:max(6px,env(safe-area-inset-bottom,0px))}

/* top strip */
.top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:2px 6px 8px}
.top h1{margin:0;font:800 19px/1.1 var(--f);letter-spacing:.2px}
.top h1 i{font-style:normal;color:var(--gold)}
.top .sp{flex:1 1 auto}
.sw{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border:1px solid var(--line);
 border-radius:999px;padding:3px}
.sw button{appearance:none;border:0;background:transparent;color:var(--mut);font:700 13px/1 var(--zh);
 padding:7px 11px;border-radius:999px;cursor:pointer}
.sw button[aria-pressed=true]{background:var(--gold);color:#241700}
.top a.lk{color:var(--mint);text-decoration:none;font-weight:700;font-size:13px;border-bottom:1px dashed rgba(95,230,210,.5)}

/* bookmark tabs */
.rail{display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:0 2px;
 margin-bottom:-1px;position:relative;z-index:2;
 -webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent);
 mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent)}
.rail::-webkit-scrollbar{display:none}
.tab{flex:0 0 auto;appearance:none;cursor:pointer;text-align:left;min-width:92px;
 background:rgba(255,255,255,.06);border:1px solid var(--line);border-bottom-color:transparent;
 border-radius:14px 14px 0 0;padding:8px 13px 10px;color:var(--mut);font-family:var(--zh);
 transition:transform .12s ease,background .12s ease}
.tab small{display:block;font:700 10.5px/1.2 var(--zh);opacity:.75;letter-spacing:.3px}
.tab b{display:block;font:700 15px/1.25 var(--zh);white-space:nowrap}
.tab:hover{background:rgba(255,255,255,.12);transform:translateY(-2px)}
.tab[aria-selected=true]{background:var(--panel);color:var(--ink);border-color:var(--line);
 box-shadow:0 -3px 0 var(--gold) inset}
.tab[aria-selected=true] small{color:var(--gold);opacity:1}
.tab:focus-visible{outline:3px solid var(--mint);outline-offset:2px}

/* panel */
.panel{min-height:0;overflow:auto;overscroll-behavior:contain;
 background:var(--panel);border:1px solid var(--line);border-radius:0 16px 16px 16px;padding:14px 16px 18px}
.ph{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin:0 0 12px}
.ph h2{margin:0;font:800 20px/1.2 var(--zh)}
.ph p{margin:3px 0 0;color:var(--mut);font-size:13.5px;max-width:62ch}
.ph .seq{margin-left:auto}
.seq{appearance:none;cursor:pointer;border:0;border-radius:999px;background:var(--gold);color:#241700;
 font:700 14px/1 var(--zh);padding:11px 16px;box-shadow:0 3px 0 #C8920F}
.seq:active{transform:translateY(2px);box-shadow:0 1px 0 #C8920F}
.seq[data-on=1]{background:var(--mint);box-shadow:0 3px 0 #2A9E8F}
h3.sub{margin:16px 0 8px;font:800 16px/1.3 var(--zh);color:var(--gold)}

.fit{transform-origin:0 0}
.rows{display:grid;gap:7px}
@media (min-width:900px){
 .rows{display:block;column-count:2;column-gap:16px}
 .rows>*{break-inside:avoid;margin-bottom:7px}
 .rows>h3.sub{column-span:all}
}
.row{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:start;
 background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:9px 12px}
.row p{margin:0}
.rt .en{font:800 19px/1.3 var(--f);letter-spacing:.2px}
.rt .zh{margin-top:2px;color:var(--mut);font-size:13px}
.row.say{background:rgba(255,197,49,.1);border-color:rgba(255,197,49,.34)}
.play{appearance:none;cursor:pointer;border:0;width:40px;height:40px;border-radius:50%;
 background:var(--gold);color:#241700;font:700 15px/1 var(--f);padding-left:2px;flex:0 0 auto}
.play:active{transform:scale(.94)}
.play[data-on=1]{background:var(--mint);animation:pulse 1s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.07)}}
.tg{display:inline-block;min-width:54px;text-align:center;border-radius:999px;padding:5px 8px;
 font:700 12px/1.2 var(--zh)}
.row.key .tg{background:rgba(95,230,210,.18);color:var(--mint)}
.row.do .tg{background:rgba(255,138,192,.18);color:var(--pink)}
.row.st .tg{background:rgba(255,255,255,.14);color:var(--ink)}
.row.ank .tg{background:rgba(167,139,250,.22);color:#D6C6FF}
.row.tip .tg{background:rgba(255,197,49,.18);color:var(--gold)}
.row.key .rt p,.row.do .rt p,.row.st .rt p,.row.tip .rt p{font-size:14.5px}
.row.ank .rt p{font:700 16px/1.35 var(--f)}
.row.chk{grid-template-columns:auto 1fr;cursor:pointer}
.row.chk input{width:22px;height:22px;accent-color:var(--gold);margin:2px 0 0}
.row.chk span{font-size:14.5px}
.row.chk:has(input:checked){opacity:.55}
.row.chk:has(input:checked) span{text-decoration:line-through}
.row.num{grid-template-columns:1fr;font-size:14.5px}
.row.two{grid-template-columns:minmax(96px,150px) 1fr;align-items:center}
.row.two b{font:700 14px/1.3 var(--zh);color:var(--gold)}
.row.two span{font-size:14.5px}
.panel.en .row.two b{color:var(--mint)}
.panel.en .row.two span{font:600 16px/1.35 var(--f)}
.row a{color:var(--mint)}
kbd{font:700 12px/1 var(--f);background:rgba(255,255,255,.16);border:1px solid var(--line);
 border-radius:5px;padding:2px 5px}
i{font-style:normal;color:var(--gold)}
.row.two i,.panel.en i{color:inherit}

/* the 22 commands */
.cards{display:grid;gap:7px;grid-template-columns:repeat(auto-fill,minmax(236px,1fr))}
.card{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;text-align:left;cursor:pointer;
 background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:12px;padding:8px 10px;color:var(--ink)}
.card:hover{background:rgba(255,255,255,.13)}
.card .pl{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--gold);
 color:#241700;font:700 12px/1 var(--f);padding-left:2px}
.card[data-on=1] .pl{background:var(--mint)}
.card b{display:block;font:800 16.5px/1.25 var(--f)}
.card i{display:block;font-style:normal;color:var(--mut);font-size:12px;font-family:var(--zh)}
.foot{display:none}

.bar{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:5px 8px 0;
 color:var(--mut);font-size:11.5px}
.bar kbd{font-size:11px}
@media (max-width:640px){
 .top h1{font-size:16px}.ph h2{font-size:17px}.rt .en{font-size:17px}
 .panel{padding:12px 12px 16px;border-radius:0 14px 14px 14px}
 .row.two{grid-template-columns:1fr;gap:3px}
 .ph .seq{margin-left:0;width:100%}
 .bar .hid{display:none}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media print{
 body{overflow:visible;background:#fff;color:#000}
 .wrap{display:block;height:auto}.rail,.top .sw,.bar,.seq,.play,.card .pl{display:none}
 .panel{display:block!important;background:#fff;border:0;padding:0 0 18px;page-break-inside:avoid}
 .panel[hidden]{display:block!important}
 .row{background:#fff;border:1px solid #bbb}.rt .en,.card b{color:#000}
 .rt .zh,.card i,.ph p{color:#333}.tg{border:1px solid #999;color:#000!important;background:#eee!important}
 i,.row.two b,h3.sub,.ph h2{color:#000}
}
</style></head><body>
<div class="wrap">
 <div class="top">
  <h1>上課腳本 <i>12/28 五甲</i></h1>
  <div class="sw" role="group" aria-label="播放速度">
   <button id="sp75" aria-pressed="false">0.75×</button>
   <button id="sp10" aria-pressed="true">1×</button>
  </div>
  <div class="sw" role="group" aria-label="跟讀模式">
   <button id="echo" aria-pressed="false">🔁 跟著唸</button>
  </div>
  <span class="sp"></span>
  <a class="lk" href="class.html">上課簡報</a>
  <a class="lk" href="plan.html">教案</a>
  <a class="lk" href="./">入口頁</a>
 </div>
 <div class="rail" role="tablist" aria-label="腳本分頁">
{{TABS}}
 </div>
{{PANELS}}
 <div class="bar">
  <span><span class="hid"><kbd>←</kbd> <kbd>→</kbd> 換分頁・<kbd>空白</kbd> 播放這一段・</span>全部 {{N}} 句都是 ElevenLabs 語音（合成語音，不是真人錄音）</span>
  <span>v{{VER}}</span>
 </div>
</div>
<script>
(function(){
 var $=function(s,r){return (r||document).querySelector(s)},
     $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
 var tabs=$$('.tab'),panels=$$('.panel'),rate=1,echo=false;
 try{var v=localStorage.getItem('dp.rate');if(v)rate=parseFloat(v)||1;
     echo=localStorage.getItem('dp.echo')==='1';}catch(e){}

 /* ---- shrink to fit: the whole page must be visible without scrolling ---- */
 function fit(p){
  var f=$('.fit',p);if(!f)return;
  f.style.transform='';f.style.width='';f.style.height='';
  p.scrollTop=0;
  var pr=p.getBoundingClientRect(),fr=f.getBoundingClientRect(),
      pb=parseFloat(getComputedStyle(p).paddingBottom)||0,
      avail=pr.bottom-pb-fr.top-2,k=1,nat=f.scrollHeight;
  for(var i=0;i<5&&nat&&nat*k>avail+0.5;i++){
   k=Math.max(0.68,avail/nat);
   f.style.transform='scale('+k.toFixed(3)+')';
   f.style.width=(100/k).toFixed(2)+'%';
   nat=f.scrollHeight;               /* wider box: the two columns rebalance */
   if(k<=0.68)break;
  }
  /* a transform does not shrink the layout box, so give it the painted height */
  if(k<1)f.style.height=Math.ceil(nat*k)+'px';
 }
 function fitNow(){var p=panels.find(function(x){return !x.hidden;});if(p)fit(p);}
 var rz;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(fitNow,120);});
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitNow);

 /* ---- tabs ---- */
 function show(id,push){
  tabs.forEach(function(t){var on=t.dataset.p===id;t.setAttribute('aria-selected',on?'true':'false');
   if(on)t.scrollIntoView({block:'nearest',inline:'nearest'});});
  panels.forEach(function(p){p.hidden=p.id!=='p-'+id;if(!p.hidden){p.scrollTop=0;fit(p);}});
  stop();
  if(push&&location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 }
 tabs.forEach(function(t){t.onclick=function(){show(t.dataset.p,true);};});
 function move(d){var i=tabs.findIndex(function(t){return t.getAttribute('aria-selected')==='true';});
  var n=Math.min(tabs.length-1,Math.max(0,i+d));if(n!==i){show(tabs[n].dataset.p,true);tabs[n].focus();}}

 /* ---- audio ---- */
 var au=new Audio(),cur=null,seq=null,qi=0,timer=0;
 au.preload='auto';
 function mark(el,on){if(el)el.dataset.on=on?'1':'';}
 function stop(){clearTimeout(timer);au.pause();au.currentTime=0;mark(cur,false);cur=null;
  if(seq){mark(seq,false);seq=null;}
  $$('.seq').forEach(function(b){b.dataset.on='';b.textContent=b.dataset.lbl||b.textContent;});}
 function play(id,el){
  clearTimeout(timer);mark(cur,false);cur=el;mark(el,true);
  au.src='voice/'+id+'.mp3';au.playbackRate=rate;
  au.play().catch(function(){mark(el,false);});
 }
 au.onended=function(){
  var wait=echo?(au.duration||1.2)*1000/rate+450:350;
  if(!seq){timer=setTimeout(function(){mark(cur,false);cur=null;},echo?wait:0);return;}
  timer=setTimeout(next,wait);
 };
 function next(){
  var list=seq.dataset.seq.split(',');
  mark(cur,false);
  if(qi>=list.length){stop();return;}
  var id=list[qi++],el=$('.play[data-a="'+id+'"]',seq.closest('.panel'));
  if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest',behavior:'smooth'});
  play(id,el);
 }
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');
  if(b){var same=cur===b&&!au.paused;stop();if(!same)play(b.dataset.a,b);return;}
  var s=e.target.closest('.seq');
  if(s){var on=seq===s;stop();if(on)return;
   seq=s;qi=0;s.dataset.lbl=s.dataset.lbl||s.textContent;s.dataset.on='1';s.textContent='■ 停止播放';next();}
 });

 /* ---- controls ---- */
 function setRate(r){rate=r;au.playbackRate=r;
  $('#sp75').setAttribute('aria-pressed',r===0.75?'true':'false');
  $('#sp10').setAttribute('aria-pressed',r===1?'true':'false');
  try{localStorage.setItem('dp.rate',r);}catch(e){}}
 $('#sp75').onclick=function(){setRate(0.75);};
 $('#sp10').onclick=function(){setRate(1);};
 function setEcho(v){echo=v;$('#echo').setAttribute('aria-pressed',v?'true':'false');
  try{localStorage.setItem('dp.echo',v?'1':'0');}catch(e){}}
 $('#echo').onclick=function(){setEcho(!echo);};
 setRate(rate);setEcho(echo);

 /* ---- checkboxes remember ---- */
 $$('.row.chk input').forEach(function(c,i){
  var k='dp.chk3.'+i;
  try{if(localStorage.getItem(k)==='1')c.checked=true;}catch(e){}
  c.onchange=function(){try{localStorage.setItem(k,c.checked?'1':'0');}catch(e){}};
 });

 /* ---- keys ---- */
 document.addEventListener('keydown',function(e){
  if(/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))||e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key==='ArrowRight'){move(1);e.preventDefault();}
  else if(e.key==='ArrowLeft'){move(-1);e.preventDefault();}
  else if(e.key===' '){var p=panels.find(function(x){return !x.hidden;});var s=p&&$('.seq',p);
   if(s){s.click();e.preventDefault();}}
  else if(e.key==='Escape'){stop();}
 });
 function fromHash(){
  var h=(location.hash||'').replace('#','');
  if(h&&tabs.some(function(t){return t.dataset.p===h;}))show(h,false);
  else show(tabs[0].dataset.p,false);
 }
 addEventListener('hashchange',fromHash);
 fromHash();
})();
</script>
</body></html>
"""

if __name__ == "__main__":
    build()
