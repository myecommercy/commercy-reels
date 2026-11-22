// tiny DSP helpers shared by the sfx generator and the audio mixer
import fs from "fs";
export const SR = 44100;
let seed = 1234567;
export const reseed = (s) => (seed = s % 2147483647 || 1);
export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
export const mk = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));
export const env = (n, a, r) => {
  const e = new Float32Array(n), A = Math.max(1, Math.round(a * SR)), R = Math.max(1, Math.round(r * SR));
  for (let i = 0; i < n; i++) e[i] = Math.min(1, i / A) * Math.min(1, (n - i) / R);
  return e;
};
export const add = (buf, at, sig, g = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < sig.length; i++) { const j = o + i; if (j >= 0 && j < buf.length) buf[j] += sig[i] * g; }
};
export const noise = (d) => { const x = mk(d); for (let i = 0; i < x.length; i++) x[i] = rnd(); return x; };
export const lowpass = (x, a) => { const y = new Float32Array(x.length); let v = 0; for (let i = 0; i < x.length; i++) { v += a * (x[i] - v); y[i] = v; } return y; };
export const highpass = (x, a) => { const lp = lowpass(x, a); return x.map((v, i) => v - lp[i]); };
export const sweep = (d, f0, f1, wave = "sin", curve = 1) => {
  const x = mk(d); let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const u = i / x.length, f = f0 + (f1 - f0) * Math.pow(u, curve);
    ph += (2 * Math.PI * f) / SR;
    x[i] = wave === "sq" ? Math.sign(Math.sin(ph)) * 0.6 : wave === "tri" ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : wave === "saw" ? ((ph / Math.PI) % 2) - 1 : Math.sin(ph);
  }
  return x;
};
export const tone = (f, d, r = 0.2, wave = "sin", a = 0.005) => { const x = sweep(d, f, f, wave); const e = env(x.length, a, r); return x.map((v, i) => v * e[i]); };
export const expEnv = (x, k) => x.map((v, i) => v * Math.exp((-i / SR) * k));
export const mul = (x, g) => x.map((v) => v * g);
export const mix = (d, parts) => { const o = mk(d); for (const [at, sig, g] of parts) add(o, at, sig, g ?? 1); return o; };
export const normalize = (x, peak = 0.9) => { let p = 1e-9; for (const v of x) p = Math.max(p, Math.abs(v)); return x.map((v) => (v / p) * peak); };
export const writeWav = (file, ch) => {
  const n = ch[0].length, C = ch.length, buf = Buffer.alloc(44 + n * C * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * C * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(C, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * C * 2, 28); buf.writeUInt16LE(C * 2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * C * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < C; c++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, ch[c][i])) * 32767), o); o += 2; }
  fs.writeFileSync(file, buf);
};
// read a 16-bit PCM wav (mono or stereo → mono)
export const readWav = (file) => {
  const b = fs.readFileSync(file);
  let p = 12, ch = 1, sr = SR, bits = 16, data = null;
  while (p < b.length) {
    const id = b.toString("ascii", p, p + 4), sz = b.readUInt32LE(p + 4);
    if (id === "fmt ") { ch = b.readUInt16LE(p + 10); sr = b.readUInt32LE(p + 12); bits = b.readUInt16LE(p + 22); }
    if (id === "data") { data = b.subarray(p + 8, p + 8 + sz); break; }
    p += 8 + sz + (sz % 2);
  }
  if (!data || bits !== 16) throw new Error("unsupported wav " + file);
  const n = Math.floor(data.length / (2 * ch)), out = new Float32Array(Math.round((n * SR) / sr));
  for (let i = 0; i < out.length; i++) { const j = Math.min(n - 1, Math.floor((i * sr) / SR)); let v = 0; for (let c = 0; c < ch; c++) v += data.readInt16LE((j * ch + c) * 2) / 32768; out[i] = v / ch; }
  return out;
};
