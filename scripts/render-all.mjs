// Renders every prepared episode (public/<id>/timings.json exists) to out/<id>.mp4
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.slice(2);
const eps = fs
  .readdirSync(path.join(ROOT, "episodes"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
  .filter((id) => !only.length || only.includes(id))
  .sort();

fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
const t0 = Date.now();
const results = [];
for (const id of eps) {
  if (!fs.existsSync(path.join(ROOT, "public", id, "timings.json"))) {
    console.log(`- ${id}: audio not prepared (run npm run audio) – skipped`);
    continue;
  }
  const out = path.join("out", `${id}.mp4`);
  console.log(`\n▶ rendering ${id} → ${out}`);
  const t = Date.now();
  const r = spawnSync("npx", ["remotion", "render", id, out, ...(process.env.GL ? [`--gl=${process.env.GL}`] : []),
    // NVENC (NVIDIA) encoding when available; falls back to CPU automatically
    "--hardware-acceleration", process.env.HWACCEL || "if-possible",
    ...(process.env.CONC ? [`--concurrency=${process.env.CONC}`] : [])], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const ok = r.status === 0;
  results.push(`${ok ? "✓" : "✗"} ${id}  (${((Date.now() - t) / 60000).toFixed(1)} min)`);
  if (!ok) console.log(`✗ ${id} failed – continuing with the next one`);
}
console.log("\n" + results.join("\n"));
console.log(`total ${((Date.now() - t0) / 60000).toFixed(1)} min`);
