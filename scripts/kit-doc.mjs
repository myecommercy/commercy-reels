// Writes KIT.md – the short catalogue of everything an episode json can use. Run after changing the kit: npm run kit-doc
import fs from "fs";
import path from "path";
import { catalog, ROOT } from "./lib/catalog.mjs";

const C = catalog();
const out = [];
out.push("# کاتالوگ کیت ریلز کامرسی (KIT.md)", "", "> این فایل خودکار ساخته می‌شود (`npm run kit-doc`). دستی ویرایشش نکن.", "> فقط اسم‌هایی که اینجا هست در JSON مجازند. `npm run check` اسم اشتباه را پیدا می‌کند.", "");
out.push(`## مدل‌های سه‌بعدی (${Object.keys(C.models).length} تا) — برای \`objects[].type\``, "", "اندازه = w × d × h پیش‌فرض (عرض × عمق × ارتفاع). می‌شود با w/d/h در object عوضش کرد.", "");
const groups = {};
for (const [k, v] of Object.entries(C.models)) (groups[v.group] ??= []).push([k, v]);
for (const [g, list] of Object.entries(groups)) {
  out.push(`### ${g}`, "", "| type | چیست | اندازه | پارامتر خاص |", "|---|---|---|---|");
  for (const [k, v] of list) out.push(`| \`${k}\` | ${v.fa} | ${v.w}×${v.d}×${v.h} | ${v.props || "—"} |`);
  out.push("");
}
out.push(`## آیکون‌ها (${Object.keys(C.icons).length} تا) — برای \`icons[].icon\` و \`packets[].icon\``, "", "| icon | معنی | icon | معنی | icon | معنی |", "|---|---|---|---|---|---|");
const ic = Object.entries(C.icons);
for (let i = 0; i < ic.length; i += 3) out.push("| " + [0, 1, 2].map((k) => (ic[i + k] ? `\`${ic[i + k][0]}\` | ${ic[i + k][1]}` : " | ")).join(" | ") + " |");
out.push("", `## صداها (${Object.keys(C.sfx).length} تا، هر کدام چند نسخه) — برای \`lines[].sfx[].name\``, "");
const sg = {};
for (const [k, v] of Object.entries(C.sfx)) (sg[v.category] ??= []).push([k, v]);
for (const [g, list] of Object.entries(sg)) out.push(`**${g}:** ` + list.map(([k, v]) => `\`${k}\` (${v.fa})`).join("، "), "");
out.push("## موزیک پس‌زمینه — برای `music`", "", C.moods.map((m) => `\`${m}\``).join("، "), "", "curious=کنجکاو (پیش‌فرض) · calm=آرام · energetic=پرانرژی · tension=تنش · epic=حماسی · happy=شاد · mystery=مرموز · festive=جشن/مناسبتی · none=بدون موزیک", "");
out.push("## تم‌ها — برای `theme`", "", C.themes.map((m) => `\`${m}\``).join("، "), "");
out.push("## اسم رنگ‌های پالت — برای `color` روی objectها یا override در theme", "", C.palette.map((m) => `\`${m}\``).join("، "), "", "پرکاربردها: `primary` (فیروزه‌ای برند)، `accent` (مژنتا)، `accent2` (بنفش ملایم)، `ok` (سبز)، `warn` (زرد)، `danger` (قرمز)، `coin` (طلایی)، `white`، `metal`.", "");
fs.writeFileSync(path.join(ROOT, "KIT.md"), out.join("\n"));
console.log(`✓ KIT.md – ${Object.keys(C.models).length} models, ${Object.keys(C.icons).length} icons, ${Object.keys(C.sfx).length} sounds`);
