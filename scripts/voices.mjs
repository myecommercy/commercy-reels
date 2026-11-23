// Downloads the ElevenLabs narration takes listed in voices/voices.json into voices/<id>/<name>.mp3
// (skips files that already exist). The links are signed and expire – see voices.json "expires".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// load .env (for HTTPS_PROXY) – curl below uses it
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
if (process.env.HTTPS_PROXY) console.log(`(proxy: ${process.env.HTTPS_PROXY})`);
const cfgFile = path.join(ROOT, "voices", "voices.json");
if (!fs.existsSync(cfgFile)) {
  console.log("voices/voices.json not found – nothing to download (put full.mp3 files in voices/<id>/ by hand).");
  process.exit(0);
}
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
const expired = Date.now() / 1000 > cfg.expires;
let ok = 0,
  skip = 0,
  fail = [];
for (const [id, name, url] of cfg.files) {
  const dir = path.join(ROOT, "voices", id);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${name}.mp3`);
  if (fs.existsSync(out) && fs.statSync(out).size > 1000) {
    skip++;
    continue;
  }
  let err = "";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(out, buf);
    console.log(`✓ ${id}/${name}.mp3 (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
    continue;
  } catch (e) {
    err = e.message;
  }
  // fallback: curl respects HTTPS_PROXY / system proxy settings (VPN, proxy apps)
  const c = spawnSync("curl", ["-sSL", "--fail", "-o", out, url], { stdio: "pipe" });
  if (c.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 1000) {
    console.log(`✓ ${id}/${name}.mp3 (via curl)`);
    ok++;
  } else {
    if (fs.existsSync(out)) fs.unlinkSync(out);
    fail.push(`${id}/${name}.mp3`);
    console.log(`✗ ${id}/${name}.mp3 – ${err}${c.stderr ? " / curl: " + c.stderr.toString().trim().slice(0, 120) : ""}`);
  }
}
console.log(`\n${ok} downloaded, ${skip} already present, ${fail.length} failed.`);
if (fail.length) {
  console.log(
    expired
      ? `The download links have expired. Download the takes manually from ${cfg.flow} and save them with the names above.`
      : `Check your internet connection (elevenlabsusercontent.com must be reachable), or download the takes manually from ${cfg.flow}.`,
  );
}
