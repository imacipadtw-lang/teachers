#!/usr/bin/env python3
"""Human-voice (ElevenLabs) clip tools for Lunch Box Lab.

  python3 voice_tools.py status            -> which required clips exist / are missing (JSON)
  python3 voice_tools.py plan [tier]       -> the exact text to record for a credit tier (JSON)
  python3 voice_tools.py ingest AUDIO TAG "Key one." "Key two." ...
                                           -> split one recording (blank-line separated lines) into clips,
                                              save raw mp3s in voice-raw/ and embeddable clips-rec-TAG.js
  python3 voice_tools.py compose           -> build missing "I like X." / "I want some X." clips from the
                                              recorded word clips plus the real "I like" / "I want some"
                                              fragments cut from the verified vocabulary recording
  python3 voice_tools.py log "text"        -> append a line to voice-log.txt

Clip keys are the exact text the app asks for: "Rice.", "I like rice.", "I want some rice.".
Recorded clips are embedded by build.py (clips-*.js, later files win; clips-0composed.js loses to real recordings).
"""
import base64, glob, json, os, re, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'voice-raw')
os.makedirs(RAW, exist_ok=True)


def default_words():
    s = open(os.path.join(HERE, 'app.html'), encoding='utf-8').read()
    blk = s[s.index('const DEFAULT_WORDS=['):]
    blk = blk[:blk.index('];')]
    out = []
    for m in re.finditer(r"\{pic:'[^']*',en:'([^']+)',zh:'[^']*',count:(true|false),pl:'([^']*)'\}", blk):
        en, count, pl = m.group(1), m.group(2) == 'true', m.group(3)
        out.append({'en': en, 'count': count, 'form': (pl or en + 's') if count else en})
    return out


def cap(t):
    return t[:1].upper() + t[1:]


def required_keys():
    keys = []
    for w in default_words():
        keys += [cap(w['en']) + '.', f"I like {w['form']}.", f"I want some {w['form']}."]
    return keys


def existing_keys():
    have = {}
    for f in sorted(glob.glob(os.path.join(HERE, 'clips-*.js'))):
        t = open(f, encoding='utf-8').read()
        a = t.index('{')
        b = t.rindex('}') + 1
        try:
            for k in json.loads(t[a:b]):
                have[k] = os.path.basename(f)
        except Exception:
            pass
    return have


def slug(key):
    return re.sub(r'[^a-z0-9]+', '_', key.lower()).strip('_')


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def duration(path):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).stdout)


def status():
    need = required_keys()
    have = existing_keys()
    missing = [k for k in need if k not in have]
    # keys that exist only as composed (not a real recording)
    composed = [k for k in need if have.get(k, '').startswith('clips-0composed')]
    real_missing = [k for k in need if k not in have or have[k].startswith('clips-0composed')]
    print(json.dumps({'need': len(need), 'have': len([k for k in need if k in have]), 'missing': missing,
                      'composed_only': composed, 'needs_real_recording': real_missing}, ensure_ascii=False, indent=1))


def plan(tier='auto'):
    need = required_keys()
    have = existing_keys()
    real_missing = [k for k in need if k not in have or have[k].startswith('clips-0composed')]
    words_missing = [k for k in real_missing if not k.startswith('I ')]
    sent_missing = [k for k in real_missing if k.startswith('I ')]
    # helper plural forms are needed to compose sentences for countable words
    helpers = []
    for w in default_words():
        if w['count'] and cap(w['en']) + '.' in words_missing or (w['count'] and f"I like {w['form']}." in real_missing):
            hk = cap(w['form']) + '.'
            if hk not in helpers and hk not in have:
                helpers.append(hk)
    full = words_missing + sent_missing
    words_only = words_missing + helpers
    print(json.dumps({
        'full_recording_lines': full,
        'words_only_lines': words_only,
        'chars_full': sum(len(x) for x in full), 'chars_words_only': sum(len(x) for x in words_only),
        'note': 'flash model ~0.5 credit/char, v4 ~1.1-1.2 credit/char (blank line between lines)'}, ensure_ascii=False, indent=1))


def speech_chunks(audio):
    out = run(['ffmpeg', '-i', audio, '-af', 'silencedetect=noise=-40dB:d=0.1', '-f', 'null', '-'])
    log = out.stderr
    dur = duration(audio)
    ev = [(m.group(1), float(m.group(2))) for m in re.finditer(r'silence_(start|end): ([0-9.]+)', log)]
    sil, st = [], None
    for k, v in ev:
        if k == 'start':
            st = v
        else:
            sil.append((st if st is not None else 0.0, v))
            st = None
    if st is not None:
        sil.append((st, dur))
    sp, cur = [], 0.0
    for a, b in sil:
        if a > cur + 0.01:
            sp.append((cur, a))
        cur = b
    if cur < dur - 0.01:
        sp.append((cur, dur))
    return sp, dur


def encode(src, a, b, dst, fade=True):
    af = 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse' if fade else 'anull'
    run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-ac', '1', '-b:a', '64k', '-af', af, dst])


def mp3_to_b64(path):
    return 'data:audio/mpeg;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def ingest(audio, tag, keys):
    sp, dur = speech_chunks(audio)
    n = len(keys)
    if len(sp) < n:
        sys.exit(f'FAIL: found {len(sp)} speech chunks, need {n}. Re-record with blank lines between lines.')
    gaps = sorted(((sp[i + 1][0] - sp[i][1], i) for i in range(len(sp) - 1)), reverse=True)
    cut = sorted(i for _, i in gaps[:n - 1])
    segs, st = [], 0
    for i in cut + [len(sp) - 1]:
        segs.append((sp[st][0], sp[i][1]))
        st = i + 1
    smallest_kept = min([g for g, _ in gaps[:n - 1]] or [9])
    largest_dropped = gaps[n - 1][0] if len(gaps) >= n else 0
    out = {}
    report = []
    for key, (a, b) in zip(keys, segs):
        a, b = max(0, a - 0.06), min(dur, b + 0.12)
        d = b - a
        if not (0.25 <= d <= 3.5):
            sys.exit(f'FAIL: clip for {key!r} is {d:.2f}s (expected 0.25-3.5s); check the recording')
        dst = os.path.join(RAW, slug(key) + '.mp3')
        encode(audio, a, b, dst)
        report.append((key, round(a, 2), round(b, 2)))
    for key in keys:
        if key in required_keys():
            out[key] = mp3_to_b64(os.path.join(RAW, slug(key) + '.mp3'))
    if out:
        open(os.path.join(HERE, f'clips-rec-{tag}.js'), 'w', encoding='utf-8').write(
            'Object.assign(window.LBL_CLIPS,' + json.dumps(out, ensure_ascii=False) + ');')
    print(json.dumps({'clips': report, 'smallest_kept_gap': round(smallest_kept, 2), 'largest_dropped_gap': round(largest_dropped, 2),
                      'embedded': list(out)}, ensure_ascii=False, indent=1))


def compose():
    need = required_keys()
    have = existing_keys()
    frag = {'I like': os.path.join(RAW, 'frag_like.mp3'), 'I want some': os.path.join(RAW, 'frag_want.mp3')}
    for f in frag.values():
        if not os.path.exists(f):
            sys.exit(f'FAIL: missing fragment {f}')
    out = {}
    for w in default_words():
        for lead in ('I like', 'I want some'):
            key = f"{lead} {w['form']}."
            if key in have and not have[key].startswith('clips-0composed'):
                continue
            wordclip = os.path.join(RAW, slug(cap(w['form']) + '.') + '.mp3')
            if not os.path.exists(wordclip):
                continue
            dst = os.path.join(RAW, 'composed_' + slug(key) + '.mp3')
            run(['ffmpeg', '-y', '-v', 'error', '-i', frag[lead], '-i', wordclip, '-filter_complex',
                 '[0:a][1:a]concat=n=2:v=0:a=1[o]', '-map', '[o]', '-ac', '1', '-b:a', '64k', dst])
            out[key] = mp3_to_b64(dst)
    if out:
        open(os.path.join(HERE, 'clips-0composed.js'), 'w', encoding='utf-8').write(
            'Object.assign(window.LBL_CLIPS,' + json.dumps(out, ensure_ascii=False) + ');')
    print(json.dumps({'composed': list(out)}, ensure_ascii=False, indent=1))


def log(text):
    with open(os.path.join(HERE, 'voice-log.txt'), 'a', encoding='utf-8') as f:
        f.write(time.strftime('%Y-%m-%d %H:%M ') + text + '\n')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if cmd == 'status':
        status()
    elif cmd == 'plan':
        plan(*(sys.argv[2:3]))
    elif cmd == 'ingest':
        ingest(sys.argv[2], sys.argv[3], sys.argv[4:])
        subprocess.run([sys.executable, os.path.join(HERE, 'normalize_clips.py')], check=False)  # even out loudness of the new clips
    elif cmd == 'compose':
        compose()
    elif cmd == 'log':
        log(' '.join(sys.argv[2:]))
    else:
        print(__doc__)
