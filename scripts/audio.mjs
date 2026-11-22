// Prepares audio for every episode in ./episodes:
//   voices/<id>/full.(mp3|wav|m4a)   – the full narration (required)
//   voices/<id>/fix.(mp3|wav|m4a)    – optional corrected take of one line (episode json: fix.line)
// Writes public/<id>/vo.wav, public/<id>/bed.wav (music + sound effects) and public/<id>/timings.json
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { readWav } from "./lib/dsp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
const only = process.argv.slice(2);

// ---------------- io ----------------
const ffmpeg = (args, input) => {
  const r = spawnSync("npx", ["remotion", "ffmpeg", ...args], { cwd: ROOT, input, maxBuffer: 1 << 30, shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + (r.stderr || "").toString().slice(-400));
  return r.stdout;
};
const decode = (file) => {
  // Remotion's bundled ffmpeg has no raw-PCM muxer, so decode to a 16-bit WAV stream and parse it
  const buf = ffmpeg(["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", "-f", "wav", "-"]);
  let o = 12;
  while (o + 8 <= buf.length) {
    const id = buf.toString("ascii", o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    if (id === "data") {
      const start = o + 8;
      const end = size === 0xffffffff || start + size > buf.length ? buf.length : start + size;
      const n = Math.floor((end - start) / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(start + i * 2) / 32768;
      return out;
    }
    o += 8 + size + (size % 2);
  }
  throw new Error("could not read audio: " + file);
};
const writeWav = (file, channels) => {
  const n = channels[0].length;
  const ch = channels.length;
  const b = Buffer.alloc(44 + n * ch * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * ch * 2, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(ch, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * ch * 2, 28);
  b.writeUInt16LE(ch * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      b.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  fs.writeFileSync(file, b);
};
const findAudio = (dir, base) => {
  for (const ext of ["mp3", "wav", "m4a", "aac", "ogg", "flac"]) {
    const f = path.join(dir, `${base}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
};

// ---------------- analysis ----------------
const silences = (x, thrDb = -38, minD = 0.22) => {
  const win = Math.round(0.02 * SR);
  const n = Math.floor(x.length / win);
  const quiet = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < win; k++) s += x[i * win + k] ** 2;
    quiet[i] = 10 * Math.log10(s / win + 1e-12) < thrDb;
  }
  const out = [];
  for (let i = 0; i < n; ) {
    if (quiet[i]) {
      let j = i;
      while (j < n && quiet[j]) j++;
      if ((j - i) * 0.02 >= minD) out.push([i * 0.02, j * 0.02]);
      i = j;
    } else i++;
  }
  return out;
};
const speechSpan = (x) => {
  const s = silences(x, -38, 0.02);
  const dur = x.length / SR;
  const start = s.length && s[0][0] === 0 ? s[0][1] : 0;
  const end = s.length && s[s.length - 1][1] >= dur - 0.05 ? s[s.length - 1][0] : dur;
  return [start, end];
};
// split speech into N lines using silences + character proportions
const segment = (x, chars) => {
  const [s0, s1] = speechSpan(x);
  const sil = silences(x, -38, 0.18).filter((s) => s[0] > s0 && s[1] < s1);
  const tot = chars.reduce((a, b) => a + b, 0);
  const picked = [];
  let acc = 0,
    last = s0;
  for (let k = 0; k < chars.length - 1; k++) {
    acc += chars[k];
    const e = s0 + ((s1 - s0) * acc) / tot;
    const remaining = chars.length - 1 - k;
    const opts = sil.filter((s) => s[0] > last + 0.6 && sil.filter((q) => q[0] > s[1]).length >= remaining - 1);
    let best = opts.length
      ? opts.reduce((a, b) => (Math.abs((a[0] + a[1]) / 2 - e) - 1.5 * (a[1] - a[0]) <= Math.abs((b[0] + b[1]) / 2 - e) - 1.5 * (b[1] - b[0]) ? a : b))
      : [e, e];
    picked.push(best);
    last = best[1];
  }
  const lines = [];
  let st = s0;
  for (const b of picked) {
    lines.push({ start: +st.toFixed(2), end: +b[0].toFixed(2) });
    st = b[1];
  }
  lines.push({ start: +st.toFixed(2), end: +s1.toFixed(2) });
  return { lines, picked, s0, s1 };
};
const slice = (x, a, b) => x.subarray(Math.max(0, Math.round(a * SR)), Math.min(x.length, Math.round(b * SR)));
const concat = (...parts) => {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const zeros = (sec) => new Float32Array(Math.round(sec * SR));

// ---------------- synthesis ----------------
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const mk = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));
const env = (n, a, r) => {
  const e = new Float32Array(n);
  const na = Math.max(1, Math.round(a * SR));
  for (let i = 0; i < n; i++) e[i] = (i < na ? i / na : 1) * Math.exp(-i / (r * SR));
  return e;
};
const add = (buf, at, sig, g = 1) => {
  const i0 = Math.round(at * SR);
  for (let i = 0; i < sig.length; i++) {
    const j = i0 + i;
    if (j >= 0 && j < buf.length) buf[j] += sig[i] * g;
  }
};
const tone = (f, d, r = 0.2, saw = false) => {
  saw = !!saw;
  const n = Math.round(d * SR);
  const e = env(n, 0.004, r);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    s[i] = (saw ? 2 * ((f * t) % 1) - 1 : Math.sin(2 * Math.PI * f * t)) * e[i];
  }
  return s;
};
const noise = (d) => {
  const s = mk(d);
  for (let i = 0; i < s.length; i++) s[i] = rnd();
  return s;
};
const lowpass = (x, a) => {
  const y = new Float32Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += a * (x[i] - acc);
    y[i] = acc;
  }
  return y;
};

// ---------------- music moods ----------------
const N_ = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi → Hz
const tri = (a, b, c) => [N_(a), N_(b), N_(c)];
const MOODS = {
  curious: { bpm: 122, chords: [tri(57, 60, 64), tri(53, 57, 60), tri(55, 60, 64), tri(55, 59, 62)], pad: 0.05, bass: [1], kick: [1], hat: 1, drums: 1 },
  calm: { bpm: 88, chords: [tri(60, 64, 71), tri(57, 60, 67), tri(53, 57, 64), tri(55, 59, 62)], pad: 0.06, bass: [1, 0, 0, 0], kick: null, hat: 0.5, drums: 0 },
  energetic: { bpm: 128, chords: [tri(52, 55, 59), tri(48, 52, 55), tri(55, 59, 62), tri(50, 54, 57)], pad: 0.04, bass: [1], saw: true, kick: [1], hat: 1.4, drums: 1.2, arp: 0.025 },
  tension: { bpm: 100, chords: [tri(50, 53, 57), tri(46, 50, 53), tri(50, 53, 57), tri(45, 49, 52)], pad: 0.05, bass: [1, 1], saw: true, kick: [1, 0, 0, 0], hat: 0, drums: 1 },
  epic: { bpm: 110, chords: [tri(50, 53, 57), tri(46, 50, 53), tri(53, 57, 60), tri(48, 52, 55)], pad: 0.07, bass: [1, 0], saw: true, kick: [1, 0, 1, 0], hat: 0.6, drums: 1.4 },
  happy: { bpm: 120, chords: [tri(60, 64, 67), tri(55, 59, 62), tri(57, 60, 64), tri(53, 57, 60)], pad: 0.04, bass: [1, 0, 1, 1], kick: [1], hat: 1, drums: 0.9, arp: 0.03 },
  mystery: { bpm: 84, chords: [tri(57, 60, 64), tri(50, 53, 57), tri(52, 56, 59), tri(57, 60, 64)], pad: 0.06, bass: [1, 0, 0, 0], kick: [1, 0, 0, 0], hat: 0.3, drums: 0.6, bell: 0.03 },
  festive: { bpm: 118, chords: [tri(55, 59, 62), tri(60, 64, 67), tri(50, 54, 57), tri(55, 59, 62)], pad: 0.04, bass: [1, 0, 1, 0], kick: [1], hat: 1, drums: 0.9, bell: 0.05, arp: 0.02 },
  none: { bpm: 0 },
};

// ---------------- sound library (sfx/index.json) ----------------
let LIB = null;
const libCache = new Map();
const loadLib = () => {
  if (LIB) return LIB;
  const f = path.join(ROOT, "sfx", "index.json");
  const probe = path.join(ROOT, "sfx", "ui.click", "1.wav");
  if (!fs.existsSync(f) || !fs.existsSync(probe)) {
    console.log("  (sfx library missing – generating it once…)");
    spawnSync(process.execPath, [path.join(ROOT, "scripts", "sfx-gen.mjs")], { stdio: "inherit" });
  }
  LIB = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  return LIB;
};
const sfxBuf = (name, v) => {
  const e = loadLib()[name];
  if (!e) {
    console.log(`  ! unknown sfx "${name}" – skipped (see KIT.md)`);
    return null;
  }
  const file = e.files[Math.abs(v) % e.files.length];
  const key = name + "/" + file;
  if (!libCache.has(key)) libCache.set(key, readWav(path.join(ROOT, "sfx", name, file)));
  return libCache.get(key);
};

const buildBed = (ep, tm) => {
  const TOTAL = tm.total;
  const N = Math.round(TOTAL * SR);
  const music = new Float32Array(N);
  const sfx = new Float32Array(N);
  const Ls = tm.lines.map((l) => l.start);
  const Ds = tm.lines.map((l) => l.end - l.start);
  const lp = (i, a) => Ls[i] + Ds[i] * a;

  // ---- music: mood from episode json ("music": "curious" | "calm" | … | "none") ----
  const mood = MOODS[ep.music || "curious"] || MOODS.curious;
  const beat = 60 / mood.bpm,
    bar = 4 * beat;
  if (mood.bpm > 0) {
    for (let b = 0; b * bar < TOTAL; b++) {
      const ch = mood.chords[b % mood.chords.length];
      const n = Math.round(bar * SR);
      const pad = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        let v = 0;
        for (const f of ch) v += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t);
        pad[i] = v * Math.min(1, t / 0.4) * Math.min(1, (bar - t) / 0.4);
      }
      add(music, b * bar, pad, mood.pad);
      if (mood.bass) for (let k = 0; k < 8; k++) if (mood.bass[k % mood.bass.length]) add(music, b * bar + (k * beat) / 2, tone(ch[0] / 2, 0.22, 0.09, mood.saw), 0.18);
      if (mood.arp) for (let k = 0; k < 8; k++) add(music, b * bar + (k * beat) / 2, tone(ch[k % ch.length] * 2, 0.18, 0.12), mood.arp);
      if (mood.bell && b % 2 === 0) add(music, b * bar, tone(ch[2] * 4, 1.2, 0.6), mood.bell);
    }
    const kn = Math.round(0.25 * SR);
    const kick = new Float32Array(kn);
    for (let i = 0; i < kn; i++) {
      const t = i / SR;
      kick[i] = Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 12);
    }
    const hatN = noise(0.05);
    const he = env(hatN.length, 0.001, 0.015);
    const hat = hatN.map((v, i) => (i ? v - hatN[i - 1] : v) * he[i]);
    for (let k = 0; k * beat < TOTAL; k++) {
      const tb = k * beat;
      if (tb > 0.4) {
        if (mood.kick && mood.kick[k % mood.kick.length]) add(music, tb, kick, 0.45 * mood.drums);
        if (mood.hat) add(music, tb + beat / 2, hat, 0.12 * mood.hat);
      }
    }
  }
  // music automation: mute at the first re-hook, duck at the second, fade at the end
  const g = new Float32Array(N).fill(1);
  const ramp = (a, b, v0, v1) => {
    const i0 = Math.max(0, Math.round(a * SR)),
      i1 = Math.min(N, Math.round(b * SR));
    for (let i = i0; i < i1; i++) g[i] = v0 + ((v1 - v0) * (i - i0)) / Math.max(1, i1 - i0);
  };
  const alerts = ep.lines.map((l, i) => (l.alert ? i : -1)).filter((i) => i >= 0);
  if (alerts[0] !== undefined) {
    const a = Ls[alerts[0]];
    ramp(a - 0.15, a - 0.05, 1, 0);
    ramp(a - 0.05, a + 0.45, 0, 0);
    ramp(a + 0.45, a + 0.7, 0, 1);
  }
  for (const k of alerts.slice(1)) {
    const a = Ls[k];
    ramp(a - 0.1, a, 1, 0.3);
    ramp(a, a + 1.0, 0.3, 0.3);
    ramp(a + 1.0, a + 1.3, 0.3, 1);
  }
  ramp(TOTAL - 1.8, TOTAL, 1, 0);
  for (let i = 0; i < N; i++) music[i] *= g[i];

  // ---- sfx kit ----
  const whoosh = (at, d = 0.5, gg = 0.25) => {
    const x = lowpass(noise(d), 0.15);
    for (let i = 0; i < x.length; i++) x[i] *= Math.sin((Math.PI * i) / x.length) ** 2;
    add(sfx, at, x, gg);
  };
  const pop = (at, f = 880, gg = 0.3) => {
    const n = Math.round(0.12 * SR);
    const e = env(n, 0.002, 0.04);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      s[i] = Math.sin(2 * Math.PI * (f + 600 * Math.exp(-t * 40)) * t) * e[i];
    }
    add(sfx, at, s, gg);
  };
  const click = (at, gg = 0.5) => {
    const x = lowpass(noise(0.03), 0.5);
    const e = env(x.length, 0.0005, 0.006);
    add(sfx, at, x.map((v, i) => v * e[i]), gg);
    add(sfx, at, tone(1800, 0.05, 0.01), 0.15 * (gg / 0.5));
  };
  const beep = (at, f, d = 0.12, gg = 0.2) => add(sfx, at, tone(f, d, d / 3), gg);
  const thud = (at, gg = 0.9) => {
    const n = Math.round(0.6 * SR);
    const s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      s[i] = Math.sin(2 * Math.PI * (45 + 60 * Math.exp(-t * 15)) * t) * Math.exp(-t * 6);
    }
    add(sfx, at, s, gg);
  };
  const riser = (atEnd, d = 0.9, gg = 0.18) => {
    const n = Math.round(d * SR);
    const nz = lowpass(noise(d), 0.25);
    const s = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      ph += (2 * Math.PI * (300 + 1500 * u * u)) / SR;
      s[i] = (nz[i] * 0.6 + 0.4 * Math.sin(ph)) * u * u;
    }
    add(sfx, atEnd - d, s, gg);
  };
  const glitch = (at, gg = 0.22) => {
    for (let k = 0; k < 6; k++) {
      const f = [90, 140, 220, 330][k % 4];
      const n = Math.round(0.035 * SR);
      const e = env(n, 0.001, 0.02);
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) s[i] = Math.sign(Math.sin((2 * Math.PI * f * i) / SR)) * e[i];
      add(sfx, at + k * 0.045, s, gg);
    }
  };
  const ching = (at, gg = 0.2) => {
    for (const f of [2637, 3136, 3951]) add(sfx, at, tone(f, 0.5, 0.18), gg / 2);
  };
  const chime = (at, notes = [1047, 1319, 1568], gg = 0.18) => notes.forEach((f, k) => beep(at + k * 0.09, f, 0.35, gg));
  const typing = (a, b, gg = 0.1) => {
    for (let k = a; k < b; k += 0.05 + Math.abs(rnd()) * 0.06) click(k, gg * (0.6 + Math.abs(rnd()) * 0.6));
  };

  // explicit sound effects:  line.sfx = [{ "name": "money.coin", "at": 0.4, "gain": 1, "v": 2 }]
  ep.lines.forEach((l, i) =>
    (l.sfx || []).forEach((x, k) => {
      const b = sfxBuf(x.name, x.v ?? i * 7 + k);
      if (b) add(sfx, lp(i, x.at ?? 0), b, 0.5 * (x.gain ?? 1));
    }),
  );
  const auto = ep.autoSfx !== false;
  // opening tap
  if (auto) click(0.42, 0.8);
  if (auto) ep.lines.forEach((l, i) => {
    const d = l.do || {};
    if (i > 0) whoosh(Ls[i] - 0.4, 0.45, 0.12);
    if (l.alert) {
      riser(Ls[i]);
      if (i === alerts[0]) {
        thud(Ls[i]);
        glitch(Ls[i] + 0.05);
      } else {
        beep(Ls[i] + 0.1, 440, 0.25, 0.2);
        beep(Ls[i] + 0.32, 349, 0.3, 0.2);
      }
    }
    (d.routes || []).forEach((r) => {
      if (r.at[1] - r.at[0] > 0.05) whoosh(lp(i, r.at[0]), Math.min(0.8, Math.max(0.35, (r.at[1] - r.at[0]) * Ds[i])), 0.22);
      if (r.dots && r.dots >= 10) typing(lp(i, r.at[0]), lp(i, Math.min(1, r.at[1] + 0.15)), 0.06);
    });
    (d.packets || []).forEach((p) => whoosh(lp(i, p.at[0]), 0.5, 0.2));
    (d.icons || []).forEach((ic) => {
      const at = lp(i, ic.at);
      if (ic.icon === "check") chime(at, [1320, 1760], 0.16);
      else if (ic.icon === "coin") ching(at);
      else if (ic.icon === "lock") {
        beep(at, 1200, 0.08);
        beep(at + 0.1, 1600, 0.1);
      } else if (ic.icon === "cross" || ic.icon === "warning" || ic.icon === "stop" || ic.icon === "bug" || ic.icon === "cartEmpty") {
        beep(at, 330, 0.18, 0.18);
        beep(at + 0.14, 262, 0.22, 0.16);
      } else if (ic.icon === "clock" || ic.icon === "calendar") {
        for (let k = 0; k < 6; k++) click(at + k * 0.18, 0.12);
      } else pop(at, 700 + ((ic.icon.length * 97) % 500));
    });
    if (d.queue) for (let n = 0; n < d.queue.n; n++) pop(lp(i, d.queue.at) + n * 0.12, 500 + n * 40, 0.12);
  });
  if (auto) ep.objects.forEach((o) => {
    if (o.from) pop(Ls[o.from] - 0.15, 620, 0.25);
  });
  // question + outro
  whoosh(tm.qStart - 0.2, 0.6, 0.25);
  pop(tm.qStart + 0.15, 760, 0.3);
  whoosh(tm.voEnd + 0.35, 0.9, 0.32);
  chime(tm.voEnd + 0.7, [523, 659, 784, 1047], 0.14);
  thud(tm.voEnd + 0.6, 0.5);

  const L = new Float32Array(N);
  for (let i = 0; i < N; i++) L[i] = Math.tanh((music[i] * 0.55 + sfx[i]) * 1.2) * 0.6;
  return L;
};

// ---------------- per episode ----------------
const epFiles = fs.readdirSync(path.join(ROOT, "episodes")).filter((f) => f.endsWith(".json")).sort();
let done = 0;
for (const f of epFiles) {
  const ep = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", f), "utf8"));
  if (only.length && !only.includes(ep.id)) continue;
  const dir = path.join(ROOT, "voices", ep.id);
  const full = findAudio(dir, "full");
  if (!full) {
    console.log(`- ${ep.id}: no voices/${ep.id}/full.mp3 – skipped`);
    continue;
  }
  const chars = ep.lines.map((l) => l.text.length);
  let vo = decode(full);
  const fixFile = findAudio(dir, "fix");
  if (fixFile && ep.fix && Number.isInteger(ep.fix.line)) {
    const k = ep.fix.line;
    const seg = segment(vo, chars);
    const fix = decode(fixFile);
    const [fs0, fs1] = speechSpan(fix);
    const fixSpeech = slice(fix, Math.max(0, fs0 - 0.03), fs1 + 0.12);
    const a = k === 0 ? 0 : (seg.picked[k - 1][0] + seg.picked[k - 1][1]) / 2;
    const b = k === chars.length - 1 ? vo.length / SR : (seg.picked[k][0] + seg.picked[k][1]) / 2;
    const pre = k === 0 ? zeros(0.25) : zeros(0.18);
    const post = k === chars.length - 1 ? zeros(0.3) : zeros(0.18);
    vo = concat(slice(vo, 0, a), pre, fixSpeech, post, slice(vo, b, vo.length / SR));
    console.log(`  ${ep.id}: replaced line ${k + 1} (${a.toFixed(2)}s – ${b.toFixed(2)}s) with fix take`);
  }
  // trim lead-in, normalise
  const [s0] = speechSpan(vo);
  vo = concat(slice(vo, Math.max(0, s0 - 0.25), vo.length / SR), zeros(0.3));
  let peak = 1e-9;
  for (const v of vo) peak = Math.max(peak, Math.abs(v));
  for (let i = 0; i < vo.length; i++) vo[i] = (vo[i] / peak) * 0.89;

  const seg = segment(vo, chars);
  const last = ep.lines[ep.lines.length - 1].text;
  const qi = Math.max(0, last.indexOf(ep.question));
  const ll = seg.lines[seg.lines.length - 1];
  const tm = {
    lines: seg.lines,
    voEnd: +seg.s1.toFixed(2),
    qStart: +(ll.start + (ll.end - ll.start) * (qi / last.length)).toFixed(2),
    total: +(vo.length / SR + 3.4).toFixed(2),
    hasAudio: true,
  };
  const out = path.join(ROOT, "public", ep.id);
  fs.mkdirSync(out, { recursive: true });
  writeWav(path.join(out, "vo.wav"), [vo]);
  const bed = buildBed(ep, tm);
  writeWav(path.join(out, "bed.wav"), [bed, bed]);
  fs.writeFileSync(path.join(out, "timings.json"), JSON.stringify(tm, null, 1));
  console.log(`✓ ${ep.id}: ${tm.total.toFixed(1)}s, lines at ${tm.lines.map((l) => l.start.toFixed(1)).join(" / ")}`);
  done++;
}
console.log(done ? `\n${done} episode(s) ready.` : "\nNo episodes prepared – put the narration files in voices/<id>/full.mp3");
