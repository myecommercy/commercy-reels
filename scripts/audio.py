"""Splice voiceover, derive line timings from silences, synthesize music bed + SFX.
usage: python3 scripts/audio.py <vo-full.mp3> [vo-end.mp3]
"""
import json, re, subprocess, sys
import numpy as np

SR = 44100
ROOT = "/home/claude/payreel"
LINES_CHARS = [78, 88, 64, 86, 100, 104, 80, 130, 120]


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def silences(x, thr_db=-38, min_d=0.22):
    win = int(0.02 * SR)
    n = len(x) // win
    rms = np.sqrt(np.mean(x[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    quiet = db < thr_db
    out, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.02 >= min_d:
                out.append((i * 0.02, j * 0.02))
            i = j
        else:
            i += 1
    return out


def speech_span(x):
    s = silences(x, min_d=0.02)
    start = s[0][1] if s and s[0][0] == 0 else 0
    end = s[-1][0] if s and s[-1][1] >= len(x) / SR - 0.05 else len(x) / SR
    return start, end


full = load(sys.argv[1])
if len(sys.argv) > 2:
    end = load(sys.argv[2])
    es, ee = speech_span(end)
    end = end[int(max(0, es - 0.05) * SR): int((ee + 0.15) * SR)]
    fs, fe = speech_span(full)
    target = fe - (ee - es)
    cands = [s for s in silences(full, min_d=0.2) if fs + 10 < s[0] < fe - 1]
    cut = min(cands, key=lambda s: abs(s[1] - target) - 0.5 * (s[1] - s[0]))
    print("splice at", cut, "target", round(target, 2))
    gap = np.zeros(int(0.35 * SR), dtype=np.float32)
    vo = np.concatenate([full[: int((cut[0] + 0.05) * SR)], gap, end])
    q_raw = cut[0] + 0.05 + 0.35
else:
    vo = full
    q_raw = None

# trim leading silence to 0.25s
s0, s1 = speech_span(vo)
trim = max(0, int((s0 - 0.25) * SR))
vo = vo[trim:]
vo = np.concatenate([vo, np.zeros(int(0.3 * SR), dtype=np.float32)])
dur = len(vo) / SR
s0, s1 = speech_span(vo)

# line boundaries
sil = [s for s in silences(vo, min_d=0.2) if s0 < s[0] < s1]
tot = sum(LINES_CHARS)
exp, acc = [], 0
for c in LINES_CHARS[:-1]:
    acc += c
    exp.append(s0 + (s1 - s0) * acc / tot)
picked, last = [], s0
for e in exp:
    opts = [s for s in sil if s[0] > last + 1.0]
    best = min(opts, key=lambda s: abs((s[0] + s[1]) / 2 - e) - 1.5 * (s[1] - s[0]))
    picked.append(best)
    last = best[1]
lines = []
st = s0
for b in picked:
    lines.append({"start": round(st, 2), "end": round(b[0], 2)})
    st = b[1]
lines.append({"start": round(st, 2), "end": round(s1, 2)})
print(json.dumps(lines))
OUTRO = 3.4
qStart = round(q_raw - trim / SR, 2) if q_raw else round(lines[-1]["start"] + (lines[-1]["end"] - lines[-1]["start"]) * 0.45, 2)
json.dump({"lines": lines, "audioEnd": round(dur, 2), "qStart": qStart, "voEnd": round(s1, 2), "total": round(dur + OUTRO, 2)}, open(f"{ROOT}/src/timings.json", "w"), indent=1)

# write vo
peak = np.max(np.abs(vo)) + 1e-9
vo_out = vo / peak * 0.89
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", f"{ROOT}/public/vo.mp3"], input=vo_out.astype(np.float32).tobytes())

# ---------------- music bed + sfx ----------------
TOTAL = dur + OUTRO
Q = qStart
VE = s1
N = int(TOTAL * SR)
t = np.arange(N) / SR
L = [l["start"] for l in lines]
E = [l["end"] for l in lines]
D = [E[i] - L[i] for i in range(9)]
rng = np.random.default_rng(3)


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-np.arange(n) / (r * SR))
    return e


def add(buf, at, sig, g=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * g


def tone(f, d, r=0.2, kind="sine"):
    n = int(d * SR)
    tt = np.arange(n) / SR
    if kind == "sine":
        s = np.sin(2 * np.pi * f * tt)
    else:
        s = 2 * ((f * tt) % 1) - 1
    return s * env(n, 0.004, r)


def lowpass(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def noise(d):
    return rng.standard_normal(int(d * SR))


music = np.zeros(N)
bpm = 122
beat = 60 / bpm
# chords Am F C G (one bar each)
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 261.6, 329.6], [196, 246.9, 293.7]]
bar = 4 * beat
nb = int(TOTAL / bar) + 1
for b in range(nb):
    ch = chords[b % 4]
    n = int(bar * SR)
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt) for f in ch)
    e = np.minimum(1, tt / 0.4) * np.minimum(1, (bar - tt) / 0.4)
    add(music, b * bar, pad * e, 0.05)
    # bass pulse on 8ths
    for k in range(8):
        add(music, b * bar + k * beat / 2, tone(ch[0] / 2, 0.22, 0.09), 0.18)
# kick + hat
kick_n = int(0.25 * SR)
kt = np.arange(kick_n) / SR
kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 12)
hat = np.diff(noise(0.05), prepend=0) * env(int(0.05 * SR), 0.001, 0.015)
k = 0
while k * beat < TOTAL:
    tb = k * beat
    if tb > 0.4:
        add(music, tb, kick, 0.45)
        add(music, tb + beat / 2, hat, 0.12)
    k += 1

# music automation: mute 0.5s at rehook1, duck at rehook2, fade out at end
g = np.ones(N)
def ramp(a, b, v0, v1):
    i, j = int(a * SR), int(b * SR)
    g[i:j] = np.linspace(v0, v1, j - i)
i3 = L[3]
ramp(i3 - 0.15, i3 - 0.05, 1, 0); g[int((i3 - 0.05) * SR): int((i3 + 0.45) * SR)] = 0; ramp(i3 + 0.45, i3 + 0.7, 0, 1)
i6 = L[6]
ramp(i6 - 0.1, i6, 1, 0.3); g[int(i6 * SR): int((i6 + 1.0) * SR)] = 0.3; ramp(i6 + 1.0, i6 + 1.3, 0.3, 1)
ramp(TOTAL - 1.8, TOTAL, 1, 0)
music *= g

sfx = np.zeros(N)
def whoosh(at, d=0.5, g_=0.25):
    n = int(d * SR)
    x = lowpass(noise(d), 0.15) * np.sin(np.linspace(0, np.pi, n)) ** 2
    add(sfx, at, x, g_)
def pop(at, f=880, g_=0.3):
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    add(sfx, at, np.sin(2 * np.pi * (f + 600 * np.exp(-tt * 40)) * tt) * env(n, 0.002, 0.04), g_)
def click(at, g_=0.5):
    add(sfx, at, lowpass(noise(0.03), 0.5) * env(int(0.03 * SR), 0.0005, 0.006), g_)
    add(sfx, at, tone(1800, 0.05, 0.01), 0.15)
def beep(at, f, d=0.12, g_=0.2):
    add(sfx, at, tone(f, d, d / 3), g_)

# S1
click(0.42, 0.8)
for k in range(int((E[0] - 0.5) / 0.25)):
    click(0.5 + k * 0.25, 0.12)
# S2
whoosh(L[1] + D[1] * 0.05)
pop(L[1] + 0.3, 700)
pop(L[1] + D[1] * 0.55, 990)
# S3
pop(L[2] + 0.2, 660)
beep(L[2] + 0.3, 1200, 0.08); beep(L[2] + 0.4, 1600, 0.1)
whoosh(L[2] + D[2] * 0.3, 0.7, 0.3)
pop(L[2] + D[2] * 0.75, 800)
# S4 thud
n = int(0.6 * SR); tt = np.arange(n) / SR
add(sfx, L[3], np.sin(2 * np.pi * (45 + 60 * np.exp(-tt * 15)) * tt) * np.exp(-tt * 6), 0.9)
add(sfx, L[3] + 0.3, tone(330, 0.3, 0.12, "saw"), 0.06)
# S5 data stream
whoosh(L[4] + D[4] * 0.3, 0.6)
k = 0
while L[4] + D[4] * 0.35 + k * 0.07 < L[4] + D[4] * 0.85:
    beep(L[4] + D[4] * 0.35 + k * 0.07, rng.choice([1400, 1700, 2100, 2500]), 0.03, 0.05)
    k += 1
pop(L[4] + D[4] * 0.75, 820)
# S6 checks
whoosh(L[5] + D[5] * 0.05)
pop(L[5] + 0.3, 760)
for i in range(3):
    at = L[5] + D[5] * (0.35 + 0.2 * i)
    beep(at, 1320, 0.14, 0.22); beep(at + 0.06, 1760, 0.14, 0.16)
pop(L[5] + D[5] * 0.85, 520)
# S7 alert + sms
beep(L[6] + 0.5, 440, 0.25, 0.2); beep(L[6] + 0.72, 349, 0.3, 0.2)
beep(L[6] + 0.95, 1568, 0.12, 0.22); beep(L[6] + 1.1, 2093, 0.18, 0.2)
pop(L[6] + 0.6, 700)
# S8 return + success
whoosh(L[7], 0.8, 0.3)
at = L[7] + D[7] * 0.42
for f, dt in [(1047, 0), (1319, 0.09), (1568, 0.18)]:
    beep(at + dt, f, 0.35, 0.18)
pop(L[7] + D[7] * 0.55, 600)
whoosh(L[7] + D[7] * 0.7, 0.6)
# S9
whoosh(L[8] - 0.3, 0.9, 0.3)
pop(L[8] + 0.5, 900, 0.35)
for f, dt in [(784, 0), (1175, 0.12)]:
    beep(L[8] + 1.4 + dt, f, 0.5, 0.16)

# --- question + outro ---
whoosh(Q - 0.2, 0.6, 0.25)
pop(Q + 0.15, 760, 0.3)
pop(VE + 0.1, 520, 0.25)
whoosh(VE + 0.35, 0.9, 0.32)
for f, dt in [(523, 0), (659, 0.1), (784, 0.2), (1047, 0.32)]:
    beep(VE + 0.7 + dt, f, 0.9, 0.14)
n = int(0.8 * SR); tt = np.arange(n) / SR
add(sfx, VE + 0.6, np.sin(2 * np.pi * (45 + 60 * np.exp(-tt * 12)) * tt) * np.exp(-tt * 5), 0.5)

# --- extra variety ---
def riser(at_end, d=0.9, g_=0.18):
    n = int(d * SR); tt = np.arange(n) / SR
    sweep = np.sin(2 * np.pi * np.cumsum(300 + 1500 * (tt / d) ** 2) / SR)
    x = (lowpass(noise(d), 0.25) * 0.6 + 0.4 * sweep) * (tt / d) ** 2
    add(sfx, at_end - d, x, g_)
def glitch(at, g_=0.22):
    for k in range(6):
        seg = np.sign(np.sin(2 * np.pi * rng.choice([90, 140, 220, 330]) * np.arange(int(0.035 * SR)) / SR))
        add(sfx, at + k * 0.045, seg * env(len(seg), 0.001, 0.02), g_)
def ching(at, g_=0.2):
    for f in [2637, 3136, 3951]:
        add(sfx, at, tone(f, 0.5, 0.18), g_ / 2)
    add(sfx, at, lowpass(noise(0.08), 0.6) * env(int(0.08 * SR), 0.001, 0.02), g_)
def soft_swish(at, g_=0.12):
    whoosh(at, 0.45, g_)
def typing(a, b, g_=0.1):
    k = a
    while k < b:
        click(k, g_ * rng.uniform(0.6, 1.2))
        k += rng.uniform(0.05, 0.11)

for i in range(1, 9):
    soft_swish(L[i] - 0.4)
riser(L[3]); riser(L[6])
glitch(L[3] + 0.05)
typing(L[4] + D[4] * 0.1, L[4] + D[4] * 0.35)
ching(L[5] + D[5] * 0.85)
st_ = L[7] + D[7] * 0.7
ching(st_ + D[7] * 0.3 * 0.9)
# clock ticks during settlement clock
k = L[7] + D[7] * 0.55
while k < E[7]:
    click(k, 0.1); k += 0.18

mix = music * 0.55 + sfx
mix = np.tanh(mix * 1.2) * 0.6
st = np.stack([mix, mix], axis=1).astype(np.float32)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", f"{ROOT}/public/bed.wav"], input=st.tobytes())
print("done; duration", round(dur, 2))
