// Prints the text to paste into ElevenLabs for one episode (uses "say" if present, otherwise "text")
// usage: npm run say ep09   → also saves voices/ep09/narration.txt
import fs from "fs";
import path from "path";
import { ROOT } from "./lib/catalog.mjs";
const id = process.argv[2];
if (!id) { console.log("usage: npm run say ep09"); process.exit(1); }
const ep = JSON.parse(fs.readFileSync(path.join(ROOT, "episodes", id + ".json"), "utf8"));
const txt = ep.lines.map((l) => l.say ?? l.text).join("\n");
fs.mkdirSync(path.join(ROOT, "voices", id), { recursive: true });
fs.writeFileSync(path.join(ROOT, "voices", id, "narration.txt"), txt);
console.log(`voice: ${ep.voice ?? "-"}\n\n${txt}\n\n→ voices/${id}/narration.txt`);
