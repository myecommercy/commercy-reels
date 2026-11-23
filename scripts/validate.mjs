// Checks episodes/*.json before rendering and explains problems in Persian.
// usage:  npm run check            (all episodes)
//         npm run check ep09       (one episode)
import fs from "fs";
import path from "path";
import { catalog, ROOT } from "./lib/catalog.mjs";

const C = catalog();
const only = process.argv.slice(2);
const files = fs.readdirSync(path.join(ROOT, "episodes")).filter((f) => f.endsWith(".json")).sort();
let errors = 0, warnings = 0;

for (const f of files) {
  const id0 = f.replace(".json", "");
  if (only.length && !only.includes(id0)) continue;
  const E = [], W = [];
  let ep;
  try {
    ep = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", f), "utf8"));
  } catch (e) {
    console.log(`✗ ${f}: JSON خراب است – ${e.message}`);
    errors++;
    continue;
  }
  const isNum = (v) => typeof v === "number" && isFinite(v);
  const frac = (v, where) => { if (!isNum(v) || v < 0 || v > 1) E.push(`${where}: عدد «at» باید بین 0 و 1 باشد (کسری از طول همان جمله)، الان ${JSON.stringify(v)} است`); };
  if (ep.id !== id0) E.push(`id باید دقیقاً "${id0}" باشد (هم‌نام فایل)`);
  for (const k of ["title", "question", "objects", "lines"]) if (ep[k] === undefined) E.push(`فیلد «${k}» وجود ندارد`);
  if (ep.theme) { const b = typeof ep.theme === "string" ? ep.theme : ep.theme.base ?? "commercy-dark"; if (!C.themes.includes(b)) E.push(`تم «${b}» وجود ندارد. تم‌ها: ${C.themes.join("، ")}`); if (typeof ep.theme === "object") for (const k of Object.keys(ep.theme)) if (k !== "base" && !C.palette.includes(k)) E.push(`کلید رنگ «${k}» در theme وجود ندارد`); }
  if (ep.music && !C.moods.includes(ep.music)) E.push(`music «${ep.music}» وجود ندارد. گزینه‌ها: ${C.moods.join("، ")}`);
  const objs = ep.objects || [], lines = ep.lines || [];
  const ids = new Set();
  const colorOk = (c) => !c || /^#[0-9a-fA-F]{6}$/.test(c) || C.palette.includes(c);
  for (const o of objs) {
    if (!o.id) E.push(`یک object بدون id`);
    if (ids.has(o.id)) E.push(`id تکراری: ${o.id}`);
    ids.add(o.id);
    if (!C.models[o.type]) E.push(`object «${o.id}»: مدلی به اسم «${o.type}» نداریم (لیست در KIT.md)`);
    if (!isNum(o.x) || !isNum(o.z)) E.push(`object «${o.id}»: x و z باید عدد باشند`);
    else if (Math.abs(o.x) > 12 || Math.abs(o.z) > 12) W.push(`object «${o.id}» خیلی دور است (x,z بین -12 و 12 باشد)`);
    for (const kk of ["labelFrom", "labelUntil"]) if (o[kk] !== undefined && (!Number.isInteger(o[kk]) || o[kk] < 0)) E.push(`object «${o.id}»: ${kk} باید شماره‌ی جمله باشد`);
    if (o.from !== undefined && (!Number.isInteger(o.from) || o.from < 0 || o.from >= lines.length)) E.push(`object «${o.id}»: from باید شماره‌ی یک جمله باشد (0 تا ${lines.length - 1})`);
    if (!colorOk(o.color)) E.push(`object «${o.id}»: رنگ «${o.color}» نامعتبر است (#RRGGBB یا اسم پالت)`);
  }
  // overlap check
  for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
    const a = objs[i], b = objs[j], A = C.models[a.type], B = C.models[b.type];
    if (!A || !B || !isNum(a.x) || !isNum(b.x)) continue;
    const ax = (a.w ?? A.w) / 2, az = (a.d ?? A.d) / 2, bx = (b.w ?? B.w) / 2, bz = (b.d ?? B.d) / 2;
    if (Math.abs(a.x - b.x) < ax + bx - 0.1 && Math.abs(a.z - b.z) < az + bz - 0.1) W.push(`«${a.id}» و «${b.id}» روی هم افتاده‌اند؛ فاصله‌شان را بیشتر کن`);
  }
  const need = (id, where) => { if (!ids.has(id)) E.push(`${where}: object «${id}» تعریف نشده`); };
  lines.forEach((l, i) => {
    const w = `جمله‌ی ${i}`;
    if (!l.text) E.push(`${w}: text خالی است`);
    if (typeof l.chip !== "string") E.push(`${w}: chip لازم است (تیتر کوتاه بالای صفحه)`);
    if (!Array.isArray(l.keys)) E.push(`${w}: keys باید آرایه باشد`);
    else for (const k of l.keys) if (l.text && !l.text.split(/\s+/).includes(k)) W.push(`${w}: کلمه‌ی کلیدی «${k}» عیناً (با علامت‌های چسبیده‌اش) یک کلمه از text نیست، پس هایلایت نمی‌شود`);
    if (/\[[a-z ]+\]/i.test(l.text || "")) E.push(`${w}: تگ‌های ElevenLabs مثل [curious] نباید داخل text باشند؛ آن‌ها فقط در متن راوی می‌آیند`);
    const d = l.do || {};
    (d.cam || []).forEach((x) => need(x, `${w} cam`));
    if (!d.cam || !d.cam.length) W.push(`${w}: cam خالی است؛ دوربین روی صحنه‌ی قبلی می‌ماند`);
    (d.routes || []).forEach((r, k) => { need(r.from, `${w} routes[${k}]`); need(r.to, `${w} routes[${k}]`); if (!Array.isArray(r.at) || r.at.length !== 2 || r.at[0] > r.at[1]) E.push(`${w} routes[${k}]: at باید [شروع, پایان] باشد`); else { frac(r.at[0], `${w} routes[${k}]`); frac(r.at[1], `${w} routes[${k}]`); } if (r.until !== undefined && (!Number.isInteger(r.until) || r.until <= i)) E.push(`${w} routes[${k}]: until باید شماره‌ی یکی از جمله‌های بعدی باشد (جمله‌ای که در آن محو می‌شود)`); });
    (d.icons || []).forEach((c, k) => { if (c.anim && !["float", "spin", "bounce", "pulse", "shake", "swing", "flip", "orbit", "none"].includes(c.anim)) E.push(`${w} icons[${k}]: anim «${c.anim}» نامعتبر است`); if (c.until === undefined && i < lines.length - 1) W.push(`${w} icons[${k}] (${c.icon}): until ندارد و تا آخر ویدیو می‌ماند`); if (!(c.icon in C.icons)) E.push(`${w} icons[${k}]: آیکونی به اسم «${c.icon}» نداریم`); need(c.on, `${w} icons[${k}]`); frac(c.at, `${w} icons[${k}]`); if (c.until !== undefined && (!Number.isInteger(c.until) || c.until <= i)) E.push(`${w} icons[${k}]: until باید شماره‌ی یکی از جمله‌های بعدی باشد`); });
    (d.packets || []).forEach((p, k) => { if (!(p.icon in C.icons)) E.push(`${w} packets[${k}]: آیکون «${p.icon}» نداریم`); need(p.from, `${w} packets[${k}]`); need(p.to, `${w} packets[${k}]`); });
    for (const key of ["alert", "dim", "pulse"]) (d[key] || []).forEach((x) => need(x, `${w} ${key}`));
    if (d.queue) { need(d.queue.from, `${w} queue`); need(d.queue.to, `${w} queue`); frac(d.queue.at, `${w} queue`); }
    (l.sfx || []).forEach((s, k) => { if (!C.sfx[s.name]) E.push(`${w} sfx[${k}]: صدایی به اسم «${s.name}» نداریم (لیست در KIT.md)`); if (s.at !== undefined) frac(s.at, `${w} sfx[${k}]`); });
  });
  if (lines.length && ep.question && !lines[lines.length - 1].text.includes(ep.question)) W.push(`question باید عیناً داخل text جمله‌ی آخر باشد، وگرنه کارت سؤال سر جایش نمی‌آید`);
  if (lines.length && !lines.some((l) => l.alert)) W.push(`هیچ جمله‌ای alert:true ندارد؛ ری‌هوک‌ها (معمولاً جمله‌ی ۲ و ۴) باید alert باشند`);
  if (lines.length > 9) W.push(`${lines.length} جمله زیاد است؛ ۶ تا ۸ جمله برای ریلز ۴۰-۵۵ ثانیه‌ای مناسب است`);
  for (const f of Array.isArray(ep.fix) ? ep.fix : ep.fix ? [ep.fix] : []) if (!Number.isInteger(f.line) || f.line < 0 || f.line >= lines.length) E.push(`fix.line نامعتبر است: ${JSON.stringify(f)}`);
  const tag = E.length ? "✗" : W.length ? "!" : "✓";
  console.log(`${tag} ${f}${E.length ? ` – ${E.length} خطا` : ""}${W.length ? ` – ${W.length} هشدار` : ""}`);
  E.forEach((m) => console.log(`   خطا:  ${m}`));
  W.forEach((m) => console.log(`   هشدار: ${m}`));
  errors += E.length;
  warnings += W.length;
}
console.log(errors ? `\n${errors} خطا – قبل از رندر درستشان کن.` : `\nبدون خطا${warnings ? ` (${warnings} هشدار)` : ""}.`);
process.exit(errors ? 1 : 0);
