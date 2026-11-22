// SRT → exact line & word timings for an episode.
// The SRT can come from anywhere (دسترس, Whisper, ElevenLabs…); its text does NOT have to match the script exactly –
// it is aligned character-by-character to the episode text, so small recognition mistakes are fine.
import fs from "fs";

const ts = (s) => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 10 ** m[4].length : NaN; };
export const parseSrt = (file) => {
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r/g, "");
  const cues = [];
  for (const block of raw.split(/\n\s*\n/)) {
    const lines = block.split("\n").filter((l) => l.trim());
    const ti = lines.findIndex((l) => l.includes("-->"));
    if (ti < 0) continue;
    const [a, b] = lines[ti].split("-->");
    const text = lines.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "");
    if (isFinite(ts(a)) && isFinite(ts(b)) && text.trim()) cues.push({ start: ts(a), end: ts(b), text });
  }
  return cues;
};

// letters only, unified Persian/Arabic forms
const norm = (c) => {
  c = c.replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").replace(/[ة]/g, "ه").replace(/[أإآ]/g, "ا").replace(/[ؤ]/g, "و");
  const fa = "۰۱۲۳۴۵۶۷۸۹", ar = "٠١٢٣٤٥٦٧٨٩";
  if (fa.includes(c)) return String(fa.indexOf(c));
  if (ar.includes(c)) return String(ar.indexOf(c));
  return /[\p{L}\p{N}]/u.test(c) && !/[ً-ْٰ]/.test(c) ? c.toLowerCase() : "";
};

// Levenshtein alignment: for each char of A returns index in B (or -1)
const align = (A, B) => {
  const n = A.length, m = B.length, W = m + 1;
  const D = new Uint32Array((n + 1) * W);
  for (let i = 0; i <= n; i++) D[i * W] = i;
  for (let j = 0; j <= m; j++) D[j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      D[i * W + j] = Math.min(D[(i - 1) * W + j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1), D[(i - 1) * W + j] + 1, D[i * W + j - 1] + 1);
  const map = new Int32Array(n).fill(-1);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const d = D[i * W + j];
    if (d === D[(i - 1) * W + j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)) { map[i - 1] = j - 1; i--; j--; }
    else if (d === D[(i - 1) * W + j] + 1) i--;
    else j--;
  }
  return map;
};

/** returns { lines:[{start,end}], words:[[t0,t1,…] per line] } in SRT time */
export const srtTimings = (cues, lineTexts) => {
  // SRT chars with interpolated times
  const B = [], BT = [];
  for (const c of cues) {
    const ch = [...c.text].map(norm).filter(Boolean);
    ch.forEach((x, k) => { B.push(x); BT.push(c.start + ((c.end - c.start) * (k + 0.5)) / Math.max(1, ch.length)); });
  }
  // script chars, remembering which word each belongs to
  const A = [], AW = []; // AW = [line, word]
  const wordsPer = lineTexts.map((t) => t.split(" "));
  wordsPer.forEach((ws, li) => ws.forEach((w, wi) => [...w].map(norm).filter(Boolean).forEach((x) => { A.push(x); AW.push([li, wi]); })));
  const map = align(A, B);
  // time per script char (interpolate gaps)
  const T = new Array(A.length).fill(NaN);
  map.forEach((j, i) => { if (j >= 0) T[i] = BT[j]; });
  let last = -1;
  for (let i = 0; i < T.length; i++) {
    if (!isNaN(T[i])) {
      if (last + 1 < i) { const t0 = last >= 0 ? T[last] : (cues[0]?.start ?? 0), t1 = T[i]; for (let k = last + 1; k < i; k++) T[k] = t0 + ((t1 - t0) * (k - last)) / (i - last); }
      last = i;
    }
  }
  for (let k = last + 1; k < T.length; k++) T[k] = last >= 0 ? T[last] + 0.06 * (k - last) : 0;
  // monotonic
  for (let i = 1; i < T.length; i++) if (T[i] < T[i - 1]) T[i] = T[i - 1];
  const words = wordsPer.map((ws) => ws.map(() => NaN));
  const wordEnd = wordsPer.map((ws) => ws.map(() => NaN));
  AW.forEach(([li, wi], i) => { if (isNaN(words[li][wi])) words[li][wi] = T[i]; wordEnd[li][wi] = T[i]; });
  // words with no letters (e.g. "—") inherit neighbour time
  words.forEach((ws, li) => ws.forEach((t, wi) => { if (isNaN(t)) ws[wi] = wi ? ws[wi - 1] : li ? words[li - 1][words[li - 1].length - 1] : 0; }));
  const charDur = 0.045;
  const lines = words.map((ws, li) => {
    const ends = wordEnd[li].filter((x) => !isNaN(x));
    return { start: Math.max(0, ws[0] - 0.05), end: (ends.length ? ends[ends.length - 1] : ws[ws.length - 1]) + charDur * 2 };
  });
  const matched = map.filter((j) => j >= 0).length / Math.max(1, A.length);
  return { lines, words, matched };
};
