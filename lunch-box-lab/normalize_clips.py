#!/usr/bin/env python3
"""Even out the loudness of every embedded clip (clips-*.js) so single words in a game do not jump in volume.

  python3 normalize_clips.py          -> measure each clip's speech level, apply a gain toward TARGET, re-encode if needed

Speech level = mean volume of the non-silent part. The gain is limited to +/-8 dB and never pushes the peak above -1 dB.
Safe to run again: clips already within 0.7 dB of the target are left untouched. Originals are saved once in voice-raw/old/.
"""
import base64, glob, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TARGET = -21.0      # dB, speech-only mean volume
MAX_GAIN = 8.0
PEAK_CEIL = -1.0    # dB
TOL = 0.5
OLD = os.path.join(HERE, 'voice-raw', 'old')


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
                        'silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=-1:stop_threshold=-40dB,volumedetect',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    mean = float(re.search(r'mean_volume: (-?[\d.]+) dB', r).group(1))
    peak = float(re.search(r'max_volume: (-?[\d.]+) dB', r).group(1))
    return mean, peak


def main():
    os.makedirs(OLD, exist_ok=True)
    td = tempfile.mkdtemp()
    changed = total = 0
    for f in sorted(glob.glob(os.path.join(HERE, 'clips-*.js'))):
        t = open(f, encoding='utf-8').read()
        a, b = t.index('{'), t.rindex('}') + 1
        clips = json.loads(t[a:b])
        touched = False
        for key, uri in list(clips.items()):
            m = re.match(r'data:audio/([a-z0-9]+);base64,(.*)', uri, re.S)
            if not m:
                continue
            total += 1
            src, dst = os.path.join(td, 'in.mp3'), os.path.join(td, 'out.mp3')
            open(src, 'wb').write(base64.b64decode(m.group(2)))
            mean, peak = measure(src)
            gain = max(-MAX_GAIN, min(MAX_GAIN, TARGET - mean))
            gain = min(gain, PEAK_CEIL - peak)          # keep headroom
            if abs(gain) < TOL:
                continue
            for _ in range(3):                          # always encode from the original once; correct by what the result measures
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89',
                                '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)
                got, _pk = measure(dst)
                err = TARGET - got
                if abs(err) < TOL or gain + err > PEAK_CEIL - peak or abs(gain + err) > MAX_GAIN:
                    break
                gain += err
            clips[key] = 'data:audio/mpeg;base64,' + base64.b64encode(open(dst, 'rb').read()).decode()
            touched = True
            changed += 1
            print(f'{os.path.basename(f)}  {key:26s} {mean:6.1f} dB -> {got:6.1f} dB  ({gain:+.1f})')
        if touched:
            bak = os.path.join(OLD, os.path.basename(f) + '.orig')
            if not os.path.exists(bak):
                shutil.copy(f, bak)
            open(f, 'w', encoding='utf-8').write(t[:a] + json.dumps(clips, ensure_ascii=False) + t[b:])
    print(f'normalize_clips: {changed} of {total} clips adjusted')


if __name__ == '__main__':
    main()
