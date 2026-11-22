// Reads the kit's source files and returns everything an episode may use.
// Used by validate.mjs and kit-doc.mjs, so KIT.md and the checker never get out of sync with the code.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const OLD_FA = {
  phone: ["گوشی (با دکمه‌ی پرداخت)", "دستگاه‌ها"], server: ["سرور", "زیرساخت"], db: ["دیتابیس", "زیرساخت"], cache: ["کش (با رعد)", "زیرساخت"],
  theme: ["قالب وردپرس (لایه‌ها)", "وب و وردپرس"], plugin: ["یک پلاگین (color)", "وب و وردپرس"], plugins: ["چند پلاگین روی هم", "وب و وردپرس"],
  crowd: ["جمعیت گوشی‌ها (خریدارها)", "آدم‌ها"], warehouse: ["انبار", "فروشگاه و لجستیک"], center: ["مرکز پردازش بزرگ با نوار نقاله", "فروشگاه و لجستیک"],
  house: ["خانه‌ی مشتری", "شهر"], truck: ["کامیون/وانت", "فروشگاه و لجستیک"], robot: ["ربات (اسکنر/بات)", "امنیت"], site: ["سایت/سرور سایت", "وب و وردپرس"],
  frame: ["قاب عکس", "اشیا"], reviews: ["دسته‌ی نظرها", "هوش مصنوعی و داده"], ai: ["هوش مصنوعی (کره‌ی نورانی)", "هوش مصنوعی و داده"],
  bin: ["سطل/سینی (color)", "اشیا"], summary: ["برگه‌ی خلاصه", "هوش مصنوعی و داده"],
};

const OLD_ICONS = { invoice: "فاکتور", page: "صفحه‌ی وب", shield: "سپر/امنیت", check: "تیک سبز", cross: "ضربدر قرمز", coin: "سکه", stop: "ایست", warning: "هشدار", lock: "قفل", order: "سفارش", box: "جعبه", gear: "چرخ‌دنده/تنظیمات", chat: "چت", clock: "ساعت", calendar: "تقویم", chart: "نمودار", search: "جستجو", wp: "لوگوی وردپرس", bug: "باگ", cart: "سبد خرید پر", cartEmpty: "سبد خالی", cookie: "کوکی", ticket: "بلیت/کد تخفیف", user: "کاربر", star: "ستاره/امتیاز", eye: "چشم/بازدید", bolt: "رعد/سرعت", truck: "کامیون/ارسال" };
export const catalog = () => {
  const models = {};
  const m1 = read("src/clay/models.tsx");
  const defBlock = m1.slice(m1.indexOf("export const DEF"), m1.indexOf("};", m1.indexOf("export const DEF")));
  for (const m of defBlock.matchAll(/^\s+(\w+): \[([\d.]+), ([\d.]+), ([\d.]+)\]/gm)) {
    const [fa, group] = OLD_FA[m[1]] ?? [m[1], "سایر"];
    models[m[1]] = { fa, group, w: +m[2], d: +m[3], h: +m[4], props: "" };
  }
  const m2 = read("src/kit/models2.tsx");
  for (const m of m2.matchAll(/^\s+(\w+): \{ C: \w+, def: \[([\d.]+), ([\d.]+), ([\d.]+)\], fa: "([^"]+)", group: "([^"]+)"(?:, props: "([^"]+)")?/gm))
    models[m[1]] = { fa: m[5], group: m[6], w: +m[2], d: +m[3], h: +m[4], props: m[7] ?? "" };

  const icons = {};
  for (const f of ["src/clay/icons.tsx", "src/kit/icons2.tsx"]) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    const s = read(f);
    for (const m of s.matchAll(/case "(\w+)":/g)) icons[m[1]] = OLD_ICONS[m[1]] ?? "";
    for (const m of s.matchAll(/^\s+(\w+): \{ fa: "([^"]+)"/gm)) icons[m[1]] = m[2];
  }
  const th = read("src/kit/theme.ts");
  const themes = [...th.matchAll(/^\s+"([\w-]+)": /gm)].map((m) => m[1]);
  const palette = [...th.slice(th.indexOf("export type Palette"), th.indexOf("};", th.indexOf("export type Palette"))).matchAll(/(\w+): string/g)].map((m) => m[1]);
  const au = read("scripts/audio.mjs");
  const moods = [...au.slice(au.indexOf("const MOODS"), au.indexOf("};", au.indexOf("const MOODS"))).matchAll(/^\s+(\w+): \{/gm)].map((m) => m[1]);
  const idx = path.join(ROOT, "sfx", "index.json");
  const sfx = fs.existsSync(idx) ? JSON.parse(fs.readFileSync(idx, "utf8")) : {};
  return { models, icons, themes, palette, moods, sfx };
};
