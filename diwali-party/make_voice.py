#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The voice pipeline for the teaching script (voice/<line id>.mp3).

Every English line in lines.json has one ElevenLabs clip. Generating 73 clips
one call at a time is slow, so lines are recorded in short batches joined by
<break time="1.5s" /> and then cut apart on those silences.

Two hard-won rules, both discovered the painful way on 115.11.22:

1. A flow render is capped at 23.719 s. Anything longer is cut off mid-word,
   and every over-long file comes back at exactly that length (397,093 bytes).
   Keep each batch under ~15 s — the planner below does — and treat any
   downloaded batch longer than 23 s as truncated; `cut` says so.
   (Two short batches CAN share a byte count: mp3 frames are 26.12 ms, so
   equal frame counts give equal sizes. Only the duration tells you.)
2. Use eleven_multilingual_v2, not eleven_v4: only multilingual_v2 honours
   <break time="…" />, and a reliable 1.5 s silence is what makes the cut
   exact. eleven_v4 just reads the lines together.

    python3 make_voice.py plan   # writes voice_batches.json + the texts to record
    python3 make_voice.py cut    # cuts scratch/*.mp3 back into voice/<id>.mp3

Between the two steps, record each batch with the ElevenLabs connector:
    creative_generate_speech(prompt=<batch text>, model_id="eleven_multilingual_v2",
        voice_id="oClOrzqamOXmtcB8iqTj", generations_count=1, flow_id=<one flow>)
then download each result's full_res_url to <scratch>/<bid>.mp3.
Credits are the teacher's own money: check account_get_usage first, and never
call a generation twice to "retry" — that charges twice.
"""
import json, os, re, sys, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, "voice")
SCRATCH = os.path.join(HERE, "scratch")          # not committed
BREAK = ' <break time="1.5s" /> '
MAX_S = 14.5                                      # est. seconds per batch (cap is 23.7)
MAX_N = 5                                         # lines per batch
VOICE_ID = "oClOrzqamOXmtcB8iqTj"                 # Emma - Bright Kids Educator (en-US)
MODEL = "eleven_multilingual_v2"


def lines():
    L = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))
    return [(x["id"], x["en"]) for g in L["groups"] for x in g["lines"]]


def est(chunk):
    return sum(len(t) / 12.5 for _, t in chunk) + 1.5 * (len(chunk) - 1)


def plan(only=None):
    todo = [x for x in lines() if (only is None or x[0] in only)]
    batches, cur = [], []
    for it in todo:
        if cur and (est(cur + [it]) > MAX_S or len(cur) >= MAX_N):
            batches.append(cur); cur = []
        cur.append(it)
    if cur:
        batches.append(cur)
    out = [dict(bid="b%02d" % i, ids=[x[0] for x in b], est=round(est(b), 1),
                text=BREAK.join(t for _, t in b)) for i, b in enumerate(batches)]
    json.dump(out, open(os.path.join(HERE, "voice_batches.json"), "w"), ensure_ascii=False, indent=1)
    print("voice: %d lines -> %d batches, %d billable characters"
          % (len(todo), len(out), sum(len(o["text"]) for o in out)))
    print("model %s  voice %s\n" % (MODEL, VOICE_ID))
    for o in out:
        print("%s  ~%4.1fs  %s\n    %s" % (o["bid"], o["est"], ",".join(o["ids"]), o["text"]))
    print("\nrecord each one, save as %s/<bid>.mp3, then: python3 make_voice.py cut" % SCRATCH)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


def silences(p, noise=-40, d=0.35):
    o = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af",
                        "silencedetect=noise=%ddB:d=%s" % (noise, d), "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    total, g, st = dur(p), [], None
    for m in re.finditer(r"silence_(start|end): ([0-9.]+)", o):
        if m.group(1) == "start":
            st = float(m.group(2))
        elif st is not None:
            g.append((st, min(float(m.group(2)), total))); st = None
    if st is not None:
        g.append((st, total))
    return g, total


def cut_one(path, n):
    """Split into n pieces on the n-1 widest interior silences (the breaks)."""
    g, total = silences(path)
    head = g[0][1] if g and g[0][0] <= 0.25 else 0.0
    tail = g[-1][0] if g and g[-1][1] >= total - 0.25 else total
    inner = [x for x in g if x[0] > 0.25 and x[1] < total - 0.25]
    inner.sort(key=lambda x: x[1] - x[0], reverse=True)
    pick = sorted(inner[:n - 1])
    if len(pick) != n - 1:
        return None, total, [round(b - a, 2) for a, b in inner]
    segs, pos = [], head
    for a, b in pick:
        segs.append((max(0, pos - 0.08), a + 0.12)); pos = b
    segs.append((max(0, pos - 0.08), min(total, tail + 0.22)))
    return segs, total, [round(b - a, 2) for a, b in pick]


def cut():
    B = json.load(open(os.path.join(HERE, "voice_batches.json"), encoding="utf-8"))
    os.makedirs(VOICE, exist_ok=True)
    bad = []
    for o in B:
        src = os.path.join(SCRATCH, o["bid"] + ".mp3")
        if not os.path.exists(src):
            bad.append((o["bid"], "not downloaded")); continue
        segs, total, info = cut_one(src, len(o["ids"]))
        if total > 23.0:   # the render cap is 23.719 s — anything near it lost its tail
            bad.append((o["bid"], "%.2fs is at the render cap: re-record it in two batches" % total))
        if not segs:
            bad.append((o["bid"], "found %d breaks, need %d" % (len(info), len(o["ids"]) - 1)))
            continue
        print("%s %5.1fs breaks %s" % (o["bid"], total, info))
        for (a, b), lid in zip(segs, o["ids"]):
            out = os.path.join(VOICE, lid + ".mp3")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "%.3f" % a, "-to", "%.3f" % b,
                            "-i", src, "-af", "afade=t=in:st=0:d=0.03",
                            "-c:a", "libmp3lame", "-b:a", "128k", out], check=True)
            print("    %-4s %5.2fs" % (lid, dur(out)))
    miss = [i for i, _ in lines() if not os.path.exists(os.path.join(VOICE, i + ".mp3"))]
    if miss:
        bad.append(("missing clips", ",".join(miss)))
    print("\nPROBLEMS: %s" % bad if bad else "\nall clips written to voice/")
    return 1 if bad else 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "plan"
    if cmd == "plan":
        plan(set(sys.argv[2:]) or None)
    elif cmd == "cut":
        sys.exit(cut())
    else:
        print(__doc__)
