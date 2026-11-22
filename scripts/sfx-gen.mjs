// Generates the built-in (self-made, license-free) sound library → sfx/<name>/<n>.wav + sfx/index.json
// run: npm run sfx-gen   (already done once; re-run only if you change a recipe)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SR, add, env, expEnv, highpass, lowpass, mix, mk, mul, noise, normalize, reseed, rnd, sweep, tone, writeWav } from "./lib/dsp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "sfx");
const P = [1, 0.84, 1.19, 0.71]; // pitch per variant
const D = [1, 1.15, 0.88, 1.3]; // length per variant

const nz = (d, a = 0.3, k = 20) => expEnv(lowpass(noise(d), a), k);
const click = (p = 1) => mix(0.06, [[0, mul(expEnv(highpass(noise(0.03), 0.3), 300), 0.7)], [0, tone(1800 * p, 0.04, 0.01), 0.3]]);
const pop = (p = 1, d = 0.12) => { const x = sweep(d, 900 * p + 600, 900 * p, "sin", 0.3); const e = env(x.length, 0.002, d * 0.6); return x.map((v, i) => v * e[i]); };
const whoosh = (d, a = 0.12, rise = false) => { const x = lowpass(noise(d), a); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= rise ? u * u : Math.sin(Math.PI * u) ** 2; } return x; };
const chord = (fs, d, gap = 0.08, wave = "sin") => mix(d + gap * fs.length, fs.map((f, k) => [k * gap, tone(f, d, d * 0.7, wave)]));
const kick = (p = 1, d = 0.5) => { const x = mk(d); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = Math.sin(2 * Math.PI * (45 * p + 80 * Math.exp(-t * 25)) * t) * Math.exp(-t * 7); } return x; };

// name: [category, persian description, recipe(variant) → Float32Array]
const R = {
  // ---- UI ----
  "ui.click": ["رابط کاربری", "کلیک موس/دکمه", (v) => click(P[v])],
  "ui.tap": ["رابط کاربری", "ضربه روی صفحه‌ی گوشی", (v) => mix(0.08, [[0, mul(nz(0.04, 0.5, 120), 0.5)], [0, pop(P[v] * 1.4, 0.05), 0.5]])],
  "ui.pop": ["رابط کاربری", "پاپ (ظاهر شدن چیزی)", (v) => pop(P[v])],
  "ui.bubble": ["رابط کاربری", "حباب / پیام چت", (v) => mix(0.2, [[0, pop(P[v] * 0.8, 0.08)], [0.06, pop(P[v] * 1.3, 0.08), 0.7]])],
  "ui.toggle": ["رابط کاربری", "سوییچ روشن/خاموش", (v) => mix(0.12, [[0, click(P[v])], [0.05, tone(1200 * P[v], 0.05, 0.03), 0.3]])],
  "ui.notif": ["رابط کاربری", "نوتیفیکیشن", (v) => chord([880 * P[v], 1320 * P[v]], 0.25, 0.1)],
  "ui.ding": ["رابط کاربری", "دینگ", (v) => tone(1568 * P[v], 0.7 * D[v], 0.6)],
  "ui.chime-up": ["رابط کاربری", "چایم بالارونده (موفقیت/شروع)", (v) => chord([523, 659, 784, 1047].map((f) => f * P[v]), 0.35)],
  "ui.chime-down": ["رابط کاربری", "چایم پایین‌رونده (پایان/لغو)", (v) => chord([1047, 784, 659, 523].map((f) => f * P[v]), 0.35)],
  "ui.success": ["رابط کاربری", "موفقیت / تیک", (v) => chord([1320 * P[v], 1760 * P[v]], 0.3, 0.09)],
  "ui.error": ["رابط کاربری", "خطا", (v) => chord([330 * P[v], 262 * P[v]], 0.22, 0.14, "sq")],
  "ui.warning": ["رابط کاربری", "هشدار کوتاه", (v) => chord([660 * P[v], 660 * P[v]], 0.12, 0.16, "tri")],
  "ui.beep": ["رابط کاربری", "بیپ", (v) => tone(1000 * P[v], 0.12 * D[v], 0.04, "tri")],
  "ui.typing": ["رابط کاربری", "تایپ کردن (۱.۲ ثانیه)", (v) => { reseed(11 + v); const o = mk(1.2 * D[v]); for (let t = 0.02; t < o.length / SR - 0.05; t += 0.06 + Math.abs(rnd()) * 0.07) add(o, t, click(0.9 + rnd() * 0.15), 0.5 + Math.abs(rnd()) * 0.5); return o; }],
  "ui.enter": ["رابط کاربری", "اینتر محکم", (v) => mix(0.15, [[0, mul(nz(0.08, 0.4, 60), 0.8)], [0, kick(P[v] * 3, 0.1), 0.5]])],
  "ui.scroll": ["رابط کاربری", "اسکرول", (v) => { const o = mk(0.5 * D[v]); for (let k = 0; k < 8; k++) add(o, k * 0.05 * D[v], click(P[v] * 1.2), 0.25 * (1 - k / 9)); return o; }],
  "ui.swipe": ["رابط کاربری", "سوایپ", (v) => mul(whoosh(0.25 * D[v], 0.35), 0.8)],
  "ui.camera": ["رابط کاربری", "شاتر دوربین / اسکرین‌شات", (v) => mix(0.25, [[0, mul(nz(0.05, 0.6, 80), 0.8)], [0.09, mul(nz(0.06, 0.4, 60), 0.6)], [0, tone(2400 * P[v], 0.03, 0.01), 0.2]])],
  "ui.count": ["رابط کاربری", "تیک شمارنده", (v) => tone(1500 * P[v], 0.04, 0.02, "tri")],
  // ---- motion ----
  "move.whoosh-fast": ["حرکت", "ووش سریع", (v) => whoosh(0.3 * D[v], 0.2)],
  "move.whoosh": ["حرکت", "ووش معمولی", (v) => whoosh(0.55 * D[v], 0.14)],
  "move.whoosh-slow": ["حرکت", "ووش آرام و بلند", (v) => whoosh(1.0 * D[v], 0.08)],
  "move.swoosh-up": ["حرکت", "سووش رو به بالا", (v) => mix(0.6, [[0, whoosh(0.5 * D[v], 0.15), 0.8], [0, mul(sweep(0.5 * D[v], 300 * P[v], 1200 * P[v]), 0.15)]])],
  "move.swoosh-down": ["حرکت", "سووش رو به پایین", (v) => mix(0.6, [[0, whoosh(0.5 * D[v], 0.15), 0.8], [0, mul(sweep(0.5 * D[v], 1200 * P[v], 300 * P[v]), 0.15)]])],
  "move.riser": ["حرکت", "رایزر کوتاه (قبل از هوک)", (v) => { const d = 0.9 * D[v]; const s = sweep(d, 300 * P[v], 1800 * P[v], "saw", 2); const n = lowpass(noise(d), 0.25); return s.map((x, i) => (x * 0.25 + n[i] * 0.6) * (i / s.length) ** 2); }],
  "move.riser-long": ["حرکت", "رایزر بلند", (v) => { const d = 2.0 * D[v]; const s = sweep(d, 200 * P[v], 2200 * P[v], "saw", 2); const n = lowpass(noise(d), 0.2); return s.map((x, i) => (x * 0.2 + n[i] * 0.6) * (i / s.length) ** 2.5); }],
  "move.drop": ["حرکت", "دراپ (افت ناگهانی)", (v) => mix(1.0, [[0, mul(sweep(0.6 * D[v], 900 * P[v], 60, "sin", 0.5), 0.6)], [0.05, kick(P[v], 0.8), 0.8]])],
  "move.zoom-in": ["حرکت", "زوم به داخل", (v) => mix(0.5, [[0, whoosh(0.4 * D[v], 0.2, true)], [0.3 * D[v], pop(P[v] * 0.6, 0.1), 0.4]])],
  "move.zoom-out": ["حرکت", "زوم به بیرون", (v) => whoosh(0.45 * D[v], 0.1)],
  "move.slide": ["حرکت", "کشیدن/سُر خوردن", (v) => mul(lowpass(noise(0.4 * D[v]), 0.05), 1.6)],
  // ---- impacts ----
  "hit.thud": ["ضربه", "تاد بم (تأکید)", (v) => kick(P[v], 0.6 * D[v])],
  "hit.impact": ["ضربه", "ضربه‌ی سنگین", (v) => mix(0.9, [[0, kick(P[v] * 0.9, 0.8)], [0, mul(nz(0.3, 0.2, 12), 0.6)]])],
  "hit.boom": ["ضربه", "بوم نرم سینمایی", (v) => mix(2.0, [[0, kick(P[v] * 0.6, 1.8)], [0, mul(nz(1.5, 0.05, 3), 0.6)]])],
  "hit.slam": ["ضربه", "کوبیدن در / بسته شدن", (v) => mix(0.5, [[0, kick(P[v] * 1.5, 0.3)], [0, mul(nz(0.15, 0.5, 40), 0.7)]])],
  "hit.stamp": ["ضربه", "مهر زدن / تایید", (v) => mix(0.4, [[0, kick(P[v] * 2, 0.2)], [0.01, mul(nz(0.08, 0.6, 50), 0.6)]])],
  "hit.knock": ["ضربه", "در زدن", (v) => mix(0.5, [0, 0.16, 0.32].map((t) => [t, kick(P[v] * 3, 0.12), 0.8]))],
  // ---- money ----
  "money.coin": ["پول", "سکه", (v) => mix(0.6, [2637, 3136, 3951].map((f) => [0, tone(f * P[v], 0.5, 0.4), 0.3]))],
  "money.coins": ["پول", "ریختن چند سکه", (v) => { reseed(40 + v); const o = mk(1.0); for (let k = 0; k < 7; k++) add(o, k * 0.08 + Math.abs(rnd()) * 0.04, tone((2600 + rnd() * 800) * P[v], 0.3, 0.25), 0.25); return o; }],
  "money.register": ["پول", "صندوق فروشگاه (کَچینگ)", (v) => mix(1.0, [[0, mul(nz(0.12, 0.5, 30), 0.6)], [0.12, chord([2093 * P[v], 2637 * P[v]], 0.6, 0.02), 0.8]])],
  "money.card": ["پول", "کشیدن کارت", (v) => { const x = highpass(noise(0.35 * D[v]), 0.2); return x.map((s, i) => s * Math.sin((Math.PI * i) / x.length) * 0.5); }],
  "money.pos": ["پول", "بیپ کارتخوان (تایید پرداخت)", (v) => chord([1800 * P[v], 1800 * P[v]], 0.1, 0.13, "sq")],
  // ---- tech ----
  "tech.glitch": ["فنی", "گلیچ دیجیتال", (v) => { reseed(70 + v); const o = mk(0.35); for (let k = 0; k < 7; k++) add(o, k * 0.045, tone([90, 140, 220, 330, 520][Math.floor(Math.abs(rnd()) * 5)] * P[v], 0.035, 0.02, "sq"), 0.5); return o; }],
  "tech.data": ["فنی", "جریان داده (بیپ‌های سریع)", (v) => { reseed(80 + v); const o = mk(0.8 * D[v]); for (let t = 0; t < o.length / SR - 0.04; t += 0.035) add(o, t, tone((800 + Math.abs(rnd()) * 1600) * P[v], 0.025, 0.01, "sq"), 0.15); return o; }],
  "tech.hum": ["فنی", "وزوز سرور (۲ ثانیه)", (v) => { const d = 2 * D[v]; const x = mix(d, [[0, tone(60 * P[v], d, 0.3, "saw"), 0.15], [0, tone(120 * P[v], d, 0.3), 0.1], [0, mul(lowpass(noise(d), 0.03), 0.6)]]); const e = env(x.length, 0.3, 0.3); return x.map((s, i) => s * e[i]); }],
  "tech.power-up": ["فنی", "روشن شدن", (v) => mul(sweep(0.8 * D[v], 80 * P[v], 900 * P[v], "saw", 0.5).map((s, i, a) => s * Math.min(1, i / (a.length * 0.1)) * Math.min(1, (a.length - i) / (a.length * 0.2))), 0.4)],
  "tech.power-down": ["فنی", "خاموش شدن / خوابیدن سرور", (v) => mul(sweep(1.1 * D[v], 900 * P[v], 40, "saw", 0.4).map((s, i, a) => s * (1 - i / a.length)), 0.4)],
  "tech.scan": ["فنی", "اسکن", (v) => mix(1.0, [[0, mul(sweep(0.9 * D[v], 400 * P[v], 2000 * P[v], "tri"), 0.25)], [0, mul(sweep(0.9 * D[v], 2000 * P[v], 400 * P[v], "tri"), 0.15)]])],
  "tech.laser": ["فنی", "لیزر", (v) => sweep(0.25 * D[v], 2400 * P[v], 300 * P[v], "sq", 0.4).map((s, i, a) => s * (1 - i / a.length) * 0.5)],
  "tech.connect": ["فنی", "وصل شدن", (v) => chord([600 * P[v], 900 * P[v], 1200 * P[v]], 0.12, 0.06, "tri")],
  "tech.disconnect": ["فنی", "قطع شدن", (v) => chord([1200 * P[v], 900 * P[v], 600 * P[v]], 0.12, 0.06, "tri")],
  "tech.modem": ["فنی", "صدای اتصال قدیمی", (v) => { reseed(90 + v); const o = mk(1.2); for (let k = 0; k < 10; k++) add(o, k * 0.11, tone((1000 + rnd() * 900) * P[v], 0.1, 0.02, "sq"), 0.2); return o; }],
  // ---- alerts ----
  "alert.alarm": ["هشدار", "آلارم", (v) => mix(1.2, [0, 0.3, 0.6, 0.9].map((t) => [t, tone(880 * P[v], 0.22, 0.05, "sq"), 0.35]))],
  "alert.siren": ["هشدار", "آژیر", (v) => { const d = 1.6 * D[v]; const x = mk(d); let ph = 0; for (let i = 0; i < x.length; i++) { const f = (700 + 400 * Math.sin((2 * Math.PI * i) / SR / 0.8)) * P[v]; ph += (2 * Math.PI * f) / SR; x[i] = Math.sin(ph) * 0.4 * Math.min(1, i / 2000) * Math.min(1, (x.length - i) / 4000); } return x; }],
  "alert.buzzer": ["هشدار", "بازر اشتباه", (v) => tone(110 * P[v], 0.5 * D[v], 0.1, "saw")],
  "alert.tension": ["هشدار", "تنش (نت ممتد)", (v) => { const d = 1.5 * D[v]; return mix(d, [[0, tone(110 * P[v], d, 0.5, "saw"), 0.15], [0, tone(116.5 * P[v], d, 0.5, "saw"), 0.15]]); }],
  "alert.heartbeat": ["هشدار", "ضربان قلب", (v) => mix(1.0, [[0, kick(P[v] * 1.3, 0.25)], [0.2, kick(P[v] * 1.1, 0.3), 0.7]])],
  // ---- time ----
  "time.tick": ["زمان", "تیک", (v) => mul(highpass(expEnv(noise(0.03), 250), 0.5), 0.6 * P[v])],
  "time.ticking": ["زمان", "تیک‌تاک ساعت (۲ ثانیه)", (v) => mix(2.0, new Array(4).fill(0).map((_, k) => [k * 0.5 * D[v], mul(highpass(expEnv(noise(0.03), 250), 0.5), k % 2 ? 0.4 : 0.6)]))],
  "time.timer-end": ["زمان", "پایان تایمر", (v) => mix(1.0, [0, 0.18, 0.36].map((t) => [t, tone(2000 * P[v], 0.12, 0.05, "tri"), 0.4]))],
  // ---- magic / reward ----
  "fx.sparkle": ["افکت", "درخشش", (v) => { reseed(100 + v); const o = mk(0.8); for (let k = 0; k < 9; k++) add(o, k * 0.06, tone((2500 + Math.abs(rnd()) * 2500) * P[v], 0.25, 0.2), 0.12); return o; }],
  "fx.magic": ["افکت", "جادو / تبدیل", (v) => mix(1.2, [[0, mul(sweep(1.0 * D[v], 400 * P[v], 2400 * P[v], "tri", 0.6), 0.2)], [0.2, chord([1047, 1319, 1568, 2093].map((f) => f * P[v]), 0.4, 0.07), 0.6]])],
  "fx.reward": ["افکت", "جایزه / لول آپ", (v) => chord([523, 659, 784, 1047, 1319].map((f) => f * P[v]), 0.25, 0.07, "sq")],
  "fx.pluck": ["افکت", "پلاک ملایم", (v) => expEnv(tone(440 * P[v], 0.6, 0.5, "tri"), 8)],
  "fx.bell": ["افکت", "زنگ", (v) => mix(1.5, [[0, expEnv(tone(880 * P[v], 1.4, 1), 3)], [0, expEnv(tone(2210 * P[v], 1.0, 0.8), 5), 0.3]])],
  "fx.paper": ["افکت", "کاغذ / ورق", (v) => mul(highpass(lowpass(noise(0.3 * D[v]), 0.6), 0.1).map((s, i, a) => s * Math.sin((Math.PI * i) / a.length)), 0.5)],
  "fx.wrong": ["افکت", "جواب غلط", (v) => chord([392 * P[v], 370 * P[v], 349 * P[v]], 0.25, 0.18, "saw")],
  "fx.right": ["افکت", "جواب درست", (v) => chord([784 * P[v], 1047 * P[v]], 0.3, 0.1, "tri")],
  "fx.boing": ["افکت", "بویینگ (طنز)", (v) => { const d = 0.6 * D[v]; const x = mk(d); let ph = 0; for (let i = 0; i < x.length; i++) { const t = i / SR; const f = (200 + 120 * Math.sin(t * 40) * Math.exp(-t * 5)) * P[v]; ph += (2 * Math.PI * f) / SR; x[i] = Math.sin(ph) * Math.exp(-t * 4) * 0.6; } return x; }],
  "fx.drum-roll": ["افکت", "درام‌رول (قبل از اعلام)", (v) => { reseed(120 + v); const d = 1.5 * D[v]; const o = mk(d); for (let t = 0; t < d - 0.05; t += 0.045) add(o, t, mul(nz(0.04, 0.6, 80), 0.3 + (0.5 * t) / d)); return o; }],
  "fx.crowd": ["افکت", "همهمه‌ی جمعیت (ساخته‌شده)", (v) => { const d = 2 * D[v]; return mul(lowpass(highpass(noise(d), 0.02), 0.08), 2).map((s, i, a) => s * (0.7 + 0.3 * Math.sin(i / 3000)) * Math.min(1, i / 8000) * Math.min(1, (a.length - i) / 8000)); }],
  "fx.engine": ["افکت", "موتور / کامیون", (v) => { const d = 1.5 * D[v]; return mix(d, [[0, tone(45 * P[v], d, 0.3, "saw"), 0.3], [0, mul(lowpass(noise(d), 0.04), 0.8)]]); }],
};

fs.mkdirSync(OUT, { recursive: true });
const index = {};
let files = 0;
for (const [name, [cat, fa, fn]] of Object.entries(R)) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  const list = [];
  for (let v = 0; v < 4; v++) {
    reseed(1000 + v * 7 + name.length);
    const x = normalize(fn(v), 0.85);
    const f = `${v + 1}.wav`;
    writeWav(path.join(dir, f), [x]);
    list.push(f);
    files++;
  }
  index[name] = { category: cat, fa, files: list, source: "self-made (scripts/sfx-gen.mjs)", license: "own" };
}
// keep entries added by the downloader (scripts/sfx-download.mjs)
const idxFile = path.join(OUT, "index.json");
const old = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, "utf8")) : {};
for (const [k, v] of Object.entries(old)) if (v.source !== "self-made (scripts/sfx-gen.mjs)") index[k] = v;
fs.writeFileSync(idxFile, JSON.stringify(index, null, 1));
console.log(`✓ ${Object.keys(R).length} sounds × 4 variants = ${files} files → sfx/`);
