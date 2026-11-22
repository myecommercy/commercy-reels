// Makes the narration with the ElevenLabs API: voices/<id>/full.mp3  (ONE take per run – no wasted credits)
// setup: copy .env.example to .env and put your key in it
// usage: npm run tts ep09                 (skips if full.mp3 already exists)
//        npm run tts ep09 -- --force      (make a new take and overwrite)
//        npm run tts ep09 -- --fix 3      (re-make ONLY line 3 → voices/ep09/fix.mp3 and sets "fix" in the json)
// Uses curl, so it follows HTTPS_PROXY / your VPN like voices.mjs does.
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import { ROOT } from "./lib/catalog.mjs";

// --- tiny .env loader ---
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }

const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_v4";
// voice ids come from .env – an episode's "voice" is one of these names (or a raw voice id)
const VOICES = {
  "علی": process.env.VOICE_ALI,
  "سارا": process.env.VOICE_SARA,
  "آیلین": process.env.VOICE_AYLIN,
};

const args = process.argv.slice(2);
const force = args.includes("--force");
const fi = args.indexOf("--fix");
const fixLine = fi >= 0 ? parseInt(args[fi + 1], 10) : null;
const ids = args.filter((a, k) => !a.startsWith("--") && !(fi >= 0 && k === fi + 1));
if (fi >= 0 && !Number.isInteger(fixLine)) { console.log("usage: npm run tts ep09 -- --fix 3   (شماره‌ی جمله از 0)"); process.exit(1); }
if (!KEY) { console.log("✗ ELEVENLABS_API_KEY در فایل .env نیست (از روی .env.example بسازش)."); process.exit(1); }
if (!ids.length) { console.log("usage: npm run tts ep09"); process.exit(1); }

for (const id of ids) {
  const f = path.join(ROOT, "episodes", id + ".json");
  if (!fs.existsSync(f)) { console.log(`✗ ${id}: episodes/${id}.json نیست`); continue; }
  const ep = JSON.parse(fs.readFileSync(f, "utf8"));
  const isFix = fixLine !== null;
  if (isFix && (fixLine < 0 || fixLine >= ep.lines.length)) { console.log(`✗ ${id}: جمله‌ی ${fixLine} وجود ندارد (0 تا ${ep.lines.length - 1})`); continue; }
  const out = path.join(ROOT, "voices", id, isFix ? "fix.mp3" : "full.mp3");
  if (!isFix && fs.existsSync(out) && !force) { console.log(`- ${id}: full.mp3 هست – رد شد (برای ساخت دوباره: --force)`); continue; }
  const voice = ep.voice in VOICES ? VOICES[ep.voice] : ep.voice;
  if (!voice) {
    console.log(`✗ ${id}: آیدی صدای «${ep.voice ?? "-"}» در .env نیست (VOICE_ALI / VOICE_SARA / VOICE_AYLIN)`);
    continue;
  }
  const text = isFix ? ep.lines[fixLine].say ?? ep.lines[fixLine].text : ep.lines.map((l) => l.say ?? l.text).join("\n");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!isFix) fs.writeFileSync(path.join(path.dirname(out), "narration.txt"), text); // what the narrator says
  const body = path.join(os.tmpdir(), `tts-${id}.json`);
  fs.writeFileSync(body, JSON.stringify({ text, model_id: MODEL }));
  console.log(`▶ ${id}: ${text.length} کاراکتر، صدای ${ep.voice ?? voice}، مدل ${MODEL} …`);
  const tmp = out + ".part";
  const r = spawnSync("curl", ["-sS", "-w", "%{http_code}", "-o", tmp, "-X", "POST",
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    "-H", `xi-api-key: ${KEY}`, "-H", "Content-Type: application/json", "--data-binary", `@${body}`], { encoding: "utf8" });
  fs.unlinkSync(body);
  const code = (r.stdout || "").trim();
  if (code === "200" && fs.existsSync(tmp) && fs.statSync(tmp).size > 5000) {
    fs.renameSync(tmp, out);
    if (isFix) {
      ep.fix = { line: fixLine };
      fs.writeFileSync(f, JSON.stringify(ep, null, 1));
      console.log(`  "fix": {"line": ${fixLine}} در episodes/${id}.json ثبت شد`);
    }
    console.log(`✓ ${id}: voices/${id}/full.mp3 (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  } else {
    const msg = fs.existsSync(tmp) ? fs.readFileSync(tmp, "utf8").slice(0, 300) : r.stderr;
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.log(`✗ ${id}: HTTP ${code || "?"} – ${msg}`);
    if (code === "403" || !code) console.log("  اگر از ایران وصل می‌شی، VPN سراسری روشن کن یا HTTPS_PROXY رو ست کن.");
  }
}
