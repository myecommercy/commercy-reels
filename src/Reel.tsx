import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { Box, COLORS, iso, P2, pointAt, polyLen, shade, TopQuad, XQuad, YQuad } from "./iso";
import { LINES } from "./script";
import timings from "./timings.json";
import { ClayWorld } from "./ClayWorld";

export const FONT = "Lahzeh";
loadFont({ family: FONT, url: staticFile("Lahzeh-Medium.woff2"), weight: "500" });
loadFont({ family: FONT, url: staticFile("Lahzeh-Bold.woff2"), weight: "700" });
loadFont({ family: FONT, url: staticFile("Lahzeh-Black.woff2"), weight: "900" });

export const T = timings.lines as { start: number; end: number }[];
export const Q = timings.qStart;
export const VE = timings.voEnd;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.45, 0, 0.2, 1);

// ---------- world layout (iso grid units) ----------
export type Obj = { x: number; y: number; w: number; d: number; h: number };
export const PHONE: Obj = { x: 0.6, y: 0.4, w: 1.3, d: 2.2, h: 0.18 };
export const STORE: Obj = { x: -3.2, y: -2.6, w: 1.5, d: 1.5, h: 2.6 };
export const GATE: Obj = { x: 1.4, y: -4.6, w: 2, d: 2, h: 2.1 };
export const SHAP: Obj = { x: -3.6, y: -7.2, w: 1.7, d: 1.7, h: 3.8 };
export const BANK_A: Obj = { x: 0.6, y: -10.2, w: 2.2, d: 1.8, h: 1.5 };
export const BANK_B: Obj = { x: -5.2, y: -12.2, w: 2.2, d: 1.8, h: 1.5 };

const top = (o: Obj, extra = 0.6): P2 => iso(o.x + o.w / 2, o.y + o.d / 2, o.h + extra);
const ground = (o: Obj) => [o.x + o.w / 2, o.y + o.d / 2] as [number, number];

// L-shaped ground route between two objects
const route = (a: Obj, b: Obj): P2[] => {
  const [ax, ay] = ground(a);
  const [bx, by] = ground(b);
  return [iso(ax, ay, 0.02), iso(ax, by, 0.02), iso(bx, by, 0.02)];
};
const R_PS = route(PHONE, STORE);
const R_SG = route(STORE, GATE);
const R_GH = route(GATE, SHAP);
const R_HA = route(SHAP, BANK_A);
const R_AB = route(BANK_A, BANK_B);

// ---------- helpers ----------
const sec = (f: number, fps: number) => f / fps;
export const prog = (t: number, i: number, a = 0, b = 1) => {
  const { start, end } = T[i];
  const d = end - start;
  return interpolate(t, [start + d * a, start + d * b], [0, 1], clamp);
};
export const pop = (frame: number, fps: number, atSec: number) =>
  spring({ frame: frame - Math.round(atSec * fps), fps, config: { damping: 11, stiffness: 170 } });

const Path: React.FC<{ p: P2[]; t: number; color?: string; width?: number; dashed?: boolean; glow?: boolean; opacity?: number }> = ({
  p,
  t,
  color = COLORS.teal,
  width = 7,
  dashed,
  glow,
  opacity = 1,
}) => {
  const L = polyLen(p);
  const d = `M${p.map((q) => q.join(",")).join(" L")}`;
  if (t <= 0) return null;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={shade(COLORS.bgDeep, 0.05)} strokeWidth={width + 10} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      {glow && (
        <path d={d} fill="none" stroke={color} strokeWidth={width + 14} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} strokeDasharray={`${L * t} ${L}`} />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "18 16" : `${L * t} ${L}`}
        opacity={dashed ? t : 1}
      />
    </g>
  );
};

const Dots: React.FC<{ p: P2[]; t: number; n?: number; color?: string; speed?: number; frame: number }> = ({
  p,
  t,
  n = 4,
  color = COLORS.tealLight,
  speed = 0.02,
  frame,
}) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const u = ((frame * speed + i / n) % 1) * Math.min(1, t * 1.6);
        const [x, y] = pointAt(p, u);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={16} fill={color} opacity={0.25} />
            <circle cx={x} cy={y} r={8} fill={color} />
          </g>
        );
      })}
    </g>
  );
};

// travelling packet from start to end of path at progress t
const Packet: React.FC<{ p: P2[]; t: number; children: React.ReactNode; lift?: number }> = ({ p, t, children, lift = 40 }) => {
  if (t <= 0 || t >= 1) return null;
  const [x, y] = pointAt(p, ease(t));
  return <g transform={`translate(${x},${y - lift})`}>{children}</g>;
};

const Label: React.FC<{ at: P2; text: string; s: number; color?: string }> = ({ at, text, s, color = COLORS.teal }) => {
  const w = text.length * 19 + 56;
  return (
    <g transform={`translate(${at[0]},${at[1]}) scale(${s})`} opacity={Math.min(1, s)}>
      <line x1={0} y1={0} x2={0} y2={-34} stroke={color} strokeWidth={3} />
      <rect x={-w / 2} y={-96} width={w} height={62} rx={14} fill={COLORS.bgDeep} stroke={color} strokeWidth={3} />
      <text x={0} y={-55} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill={COLORS.white} direction="rtl">
        {text}
      </text>
    </g>
  );
};

// ---------- icons (centered at 0,0) ----------
const IconInvoice = () => (
  <g>
    <rect x={-42} y={-54} width={84} height={108} rx={10} fill={COLORS.white} />
    <rect x={-42} y={-54} width={84} height={24} rx={10} fill={COLORS.teal} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={-28} y={-14 + i * 16} width={i === 3 ? 30 : 56} height={7} rx={3.5} fill={shade(COLORS.petrol, 0.35)} />
    ))}
  </g>
);
const IconShield = () => (
  <g>
    <path d="M0,-60 L48,-40 L48,0 C48,34 22,52 0,62 C-22,52 -48,34 -48,0 L-48,-40 Z" fill={COLORS.tealLight} />
    <rect x={-18} y={-6} width={36} height={30} rx={6} fill={COLORS.bgDeep} />
    <path d="M-11,-6 L-11,-16 A11,11 0 0 1 11,-16 L11,-6" fill="none" stroke={COLORS.bgDeep} strokeWidth={7} />
  </g>
);
const IconEyeSlash = () => (
  <g>
    <circle r={58} fill={COLORS.magenta} />
    <path d="M-38,0 Q0,-36 38,0 Q0,36 -38,0 Z" fill="none" stroke={COLORS.white} strokeWidth={7} />
    <circle r={11} fill={COLORS.white} />
    <line x1={-34} y1={-34} x2={34} y2={34} stroke={COLORS.white} strokeWidth={9} strokeLinecap="round" />
  </g>
);
const IconCard = () => (
  <g>
    <rect x={-58} y={-36} width={116} height={72} rx={10} fill={COLORS.teal} />
    <rect x={-58} y={-18} width={116} height={14} fill={COLORS.bgDeep} opacity={0.7} />
    <rect x={-44} y={10} width={26} height={16} rx={3} fill={COLORS.soft} opacity={0.9} />
    <rect x={2} y={14} width={42} height={7} rx={3} fill={COLORS.soft} opacity={0.7} />
  </g>
);
const IconCheck: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s})`}>
    <circle r={30} fill={COLORS.tealLight} />
    <path d="M-13,1 L-4,10 L14,-9" fill="none" stroke={COLORS.bgDeep} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const IconCoin: React.FC<{ minus?: boolean }> = ({ minus }) => (
  <g>
    <circle r={40} fill="#F2C94C" stroke="#D9A92A" strokeWidth={6} />
    <text y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#9C7414">
      {minus ? "−" : "﷼"}
    </text>
  </g>
);
const IconStop = () => (
  <g>
    <polygon points="-24,-58 24,-58 58,-24 58,24 24,58 -24,58 -58,24 -58,-24" fill={COLORS.magenta} stroke={COLORS.white} strokeWidth={5} />
    <rect x={-32} y={-9} width={64} height={18} rx={4} fill={COLORS.white} />
  </g>
);
const IconClock: React.FC<{ a: number }> = ({ a }) => (
  <g>
    <circle r={46} fill={COLORS.soft} />
    <circle r={46} fill="none" stroke={COLORS.tealLight} strokeWidth={6} />
    <line x1={0} y1={0} x2={0} y2={-30} stroke={COLORS.bgDeep} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a})`} />
    <line x1={0} y1={0} x2={20} y2={0} stroke={COLORS.bgDeep} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a / 12})`} />
    <circle r={5} fill={COLORS.bgDeep} />
  </g>
);
const IconOrder = () => (
  <g>
    <rect x={-60} y={-34} width={120} height={68} rx={16} fill={COLORS.white} />
    <circle cx={-30} cy={0} r={18} fill={COLORS.teal} />
    <path d="M-38,0 L-32,6 L-21,-6" fill="none" stroke={COLORS.white} strokeWidth={5} strokeLinecap="round" />
    <rect x={-4} y={-10} width={48} height={8} rx={4} fill={COLORS.petrol} />
    <rect x={-4} y={6} width={32} height={8} rx={4} fill={COLORS.petrol} opacity={0.5} />
  </g>
);

const Stopwatch: React.FC<{ value: number; s: number }> = ({ value, s }) => (
  <g transform={`scale(${s})`}>
    <rect x={-14} y={-118} width={28} height={20} rx={5} fill={COLORS.tealLight} />
    <circle r={100} fill={COLORS.bgDeep} stroke={COLORS.tealLight} strokeWidth={8} />
    <circle
      r={84}
      fill="none"
      stroke={COLORS.teal}
      strokeWidth={10}
      strokeDasharray={`${(value / 3) * 2 * Math.PI * 84} 999`}
      transform="rotate(-90)"
      strokeLinecap="round"
    />
    <text y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill={COLORS.white}>
      {value.toFixed(2).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]).replace(".", "٫")}
    </text>
  </g>
);

// ---------- world ----------
const Ground = () => (
  <g>
    <polygon
      points={[iso(-7.5, -14.5), iso(4.5, -14.5), iso(4.5, 3.8), iso(-7.5, 3.8)].map((p) => p.join(",")).join(" ")}
      fill={COLORS.ground}
      stroke={shade(COLORS.teal, -0.55)}
      strokeWidth={3}
    />
    {/* island thickness */}
    <polygon
      points={[iso(4.5, -14.5), iso(4.5, 3.8), iso(4.5, 3.8, -0.5), iso(4.5, -14.5, -0.5)].map((p) => p.join(",")).join(" ")}
      fill={shade(COLORS.ground, -0.3)}
    />
    <polygon
      points={[iso(-7.5, 3.8), iso(4.5, 3.8), iso(4.5, 3.8, -0.5), iso(-7.5, 3.8, -0.5)].map((p) => p.join(",")).join(" ")}
      fill={shade(COLORS.ground, -0.5)}
    />
    {new Array(13).fill(0).map((_, i) => {
      const x = -7.5 + i;
      const a = iso(x, -14.5);
      const b = iso(x, 3.8);
      return <line key={"x" + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={COLORS.teal} strokeOpacity={0.07} strokeWidth={2} />;
    })}
    {new Array(19).fill(0).map((_, i) => {
      const y = -14.5 + i;
      const a = iso(-7.5, y);
      const b = iso(4.5, y);
      return <line key={"y" + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={COLORS.teal} strokeOpacity={0.07} strokeWidth={2} />;
    })}
  </g>
);

const Phone: React.FC<{ press: number; glow: number }> = ({ press, glow }) => {
  const o = PHONE;
  return (
    <g>
      <Box x={o.x} y={o.y} w={o.w} d={o.d} h={o.h} color={COLORS.petrol} />
      <TopQuad x={o.x + 0.1} y={o.y + 0.12} z={o.h} w={o.w - 0.2} d={o.d - 0.24} fill={COLORS.bgDeep} />
      {/* product rows */}
      <TopQuad x={o.x + 0.22} y={o.y + 0.3} z={o.h} w={o.w - 0.44} d={0.35} fill={COLORS.petrol} />
      <TopQuad x={o.x + 0.22} y={o.y + 0.8} z={o.h} w={o.w - 0.44} d={0.35} fill={COLORS.petrol} />
      {/* pay button */}
      <TopQuad
        x={o.x + 0.22}
        y={o.y + 1.5 + press * 0.03}
        z={o.h + 0.02 - press * 0.02}
        w={o.w - 0.44}
        d={0.42}
        fill={glow > 0 ? COLORS.tealLight : COLORS.teal}
      />
    </g>
  );
};

const Server: React.FC<{ o: Obj; opacity?: number; led: number; frame: number }> = ({ o, opacity = 1, led, frame }) => (
  <g opacity={opacity}>
    <Box {...o} color={COLORS.slate} />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <XQuad x={o.x + o.w + 0.001} y={o.y + 0.15} z={0.25 + i * 0.45} d={o.d - 0.3} h={0.28} fill={shade(COLORS.slate, -0.35)} />
        <XQuad
          x={o.x + o.w + 0.002}
          y={o.y + 0.22}
          z={0.33 + i * 0.45}
          d={0.12}
          h={0.12}
          fill={COLORS.tealLight}
          opacity={led > 0 ? 0.4 + 0.6 * ((Math.sin(frame / 3 + i * 1.7) + 1) / 2) : 0.35}
        />
        <YQuad x={o.x + 0.15} y={o.y + o.d + 0.001} z={0.25 + i * 0.45} w={o.w - 0.3} h={0.28} fill={shade(COLORS.slate, -0.5)} />
      </g>
    ))}
  </g>
);

const Building: React.FC<{ o: Obj; color: string; win?: string }> = ({ o, color, win = COLORS.tealLight }) => (
  <g>
    <Box {...o} color={color} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <g key={`${r}${c}`}>
          <XQuad x={o.x + o.w + 0.001} y={o.y + 0.25 + c * ((o.d - 0.5) / 3)} z={0.35 + r * ((o.h - 0.6) / 3)} d={0.3} h={0.28} fill={win} opacity={0.55} />
          <YQuad x={o.x + 0.25 + c * ((o.w - 0.5) / 3)} y={o.y + o.d + 0.001} z={0.35 + r * ((o.h - 0.6) / 3)} w={0.3} h={0.28} fill={win} opacity={0.3} />
        </g>
      )),
    )}
  </g>
);

const Tower: React.FC<{ o: Obj; frame: number; active: number }> = ({ o, frame, active }) => (
  <g>
    <Box {...o} color={COLORS.slate} />
    <Box x={o.x + 0.35} y={o.y + 0.35} z={o.h} w={o.w - 0.7} d={o.d - 0.7} h={0.6} color={COLORS.petrol} />
    {new Array(7).fill(0).map((_, i) => (
      <XQuad
        key={i}
        x={o.x + o.w + 0.001}
        y={o.y + 0.2}
        z={0.3 + i * 0.5}
        d={o.d - 0.4}
        h={0.08}
        fill={COLORS.tealLight}
        opacity={active > 0 ? 0.3 + 0.7 * ((Math.sin(frame / 4 - i) + 1) / 2) : 0.25}
      />
    ))}
    {/* antenna */}
    {(() => {
      const a = iso(o.x + o.w / 2, o.y + o.d / 2, o.h + 0.6);
      const b = iso(o.x + o.w / 2, o.y + o.d / 2, o.h + 1.5);
      return (
        <g>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={COLORS.tealLight} strokeWidth={6} />
          <circle cx={b[0]} cy={b[1]} r={12} fill={COLORS.tealLight} opacity={active > 0 ? 0.6 + 0.4 * Math.sin(frame / 3) : 0.5} />
        </g>
      );
    })()}
  </g>
);

const Bank: React.FC<{ o: Obj }> = ({ o }) => {
  const roofA: [number, number, number][] = [
    [o.x - 0.1, o.y + o.d + 0.1, o.h],
    [o.x + o.w + 0.1, o.y + o.d + 0.1, o.h],
    [o.x + o.w + 0.1, o.y + o.d / 2, o.h + 0.8],
    [o.x - 0.1, o.y + o.d / 2, o.h + 0.8],
  ];
  const roofSide: [number, number, number][] = [
    [o.x + o.w + 0.1, o.y - 0.1, o.h],
    [o.x + o.w + 0.1, o.y + o.d + 0.1, o.h],
    [o.x + o.w + 0.1, o.y + o.d / 2, o.h + 0.8],
  ];
  const P = (arr: [number, number, number][]) => arr.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");
  return (
    <g>
      <Box x={o.x - 0.15} y={o.y - 0.15} w={o.w + 0.3} d={o.d + 0.3} h={0.18} color={COLORS.petrol} />
      <Box {...o} z={0.18} h={o.h - 0.18} color={"#3E6B75"} />
      {[0, 1, 2, 3].map((i) => (
        <YQuad key={i} x={o.x + 0.2 + i * ((o.w - 0.5) / 3)} y={o.y + o.d + 0.002} z={0.25} w={0.14} h={o.h - 0.35} fill={shade(COLORS.soft, -0.2)} opacity={0.85} />
      ))}
      <polygon points={P(roofSide)} fill={shade(COLORS.petrol, -0.1)} stroke={shade(COLORS.petrol, 0.35)} strokeWidth={1.2} />
      <polygon points={P(roofA)} fill={shade(COLORS.petrol, 0.25)} stroke={shade(COLORS.petrol, 0.4)} strokeWidth={1.2} />
    </g>
  );
};

// ---------- camera keyframes (one per line, plus intro) ----------
export type Cam = { at: P2; s: number };
const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const SAFE = { cx: 540, cy: 760, w: 900, h: 860 };
const fit = (objs: Obj[], maxS: number, pad = 1.3, dy = 0): Cam => {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const o of objs) {
    for (const [x, y, z] of [
      [o.x, o.y, 0], [o.x + o.w, o.y, 0], [o.x, o.y + o.d, 0], [o.x + o.w, o.y + o.d, 0],
      [o.x + o.w / 2, o.y + o.d / 2, o.h + pad],
    ] as [number, number, number][]) {
      const [sx, sy] = iso(x, y, z);
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
  }
  const s = Math.min(maxS, SAFE.w / (x1 - x0), SAFE.h / (y1 - y0));
  return { at: [(x0 + x1) / 2, (y0 + y1) / 2 + dy], s };
};
export const CAMS: Cam[] = [
  fit([PHONE], 1.9, 3.2),
  fit([PHONE, STORE], 1.6),
  fit([STORE, GATE], 1.5, 2.2),
  fit([STORE, GATE], 1.7, 1.6),
  fit([GATE, SHAP], 1.4, 2.2),
  fit([SHAP, BANK_A], 1.4, 2.4),
  fit([BANK_A, BANK_B], 1.4, 2.4),
  fit([BANK_A, BANK_B, STORE, GATE, SHAP], 1.0, 2),
  fit([PHONE, STORE, GATE, SHAP, BANK_A, BANK_B], 0.75, 1.5, 120),
];

export const camAt = (t: number) => {
  // move to cam i during first ~0.9s of line i
  let cur = CAMS[0];
  for (let i = 1; i < T.length; i++) {
    const st = T[i].start - 0.35;
    const k = interpolate(t, [st, st + 1.0], [0, 1], { ...clamp, easing: ease });
    if (k <= 0) break;
    const nx = CAMS[i];
    cur = {
      at: [cur.at[0] + (nx.at[0] - cur.at[0]) * k, cur.at[1] + (nx.at[1] - cur.at[1]) * k],
      s: cur.s + (nx.s - cur.s) * k,
    };
  }
  return cur;
};

// ---------- captions ----------
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const i = T.findIndex((l) => t >= l.start - 0.1 && t <= l.end + 0.3);
  if (i < 0) return null;
  const line = LINES[i];
  const words = line.text.split(" ");
  // chunk by phrase (punctuation), then into balanced groups of <=4 words
  const chunks: string[][] = [];
  let phrase: string[] = [];
  const flush = () => {
    if (!phrase.length) return;
    const n = Math.ceil(phrase.length / 4);
    const size = Math.ceil(phrase.length / n);
    for (let k = 0; k < phrase.length; k += size) chunks.push(phrase.slice(k, k + size));
    phrase = [];
  };
  for (const w of words) {
    phrase.push(w);
    if (/[.،,؟?!؛:]$/.test(w)) flush();
  }
  flush();
  const weights = chunks.map((c) => c.join(" ").length + 3);
  const W = weights.reduce((a, b) => a + b, 0);
  const { start, end } = T[i];
  const dur = end - start;
  let acc = start;
  let ci = chunks.length - 1;
  let cStart = start;
  let cEnd = end;
  for (let k = 0; k < chunks.length; k++) {
    const d = (dur * weights[k]) / W;
    if (t < acc + d) {
      ci = k;
      cStart = acc;
      cEnd = acc + d;
      break;
    }
    acc += d;
  }
  const chunk = chunks[ci];
  const local = interpolate(t, [cStart, cEnd], [0, 1], clamp);
  const chars = chunk.map((w) => w.length + 1);
  const CW = chars.reduce((a, b) => a + b, 0);
  const hl = line.alert ? COLORS.magenta : COLORS.teal;
  let cAcc = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1330,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px 18px",
        direction: "rtl",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 76,
        lineHeight: 1.25,
      }}
    >
      {chunk.map((w, k) => {
        const ws = cAcc / CW;
        cAcc += chars[k];
        const on = local >= ws - 0.02;
        const isKey = line.keys.includes(w);
        const appear = interpolate(local, [ws - 0.05, ws + 0.06], [0, 1], clamp);
        return (
          <span
            key={`${ci}-${k}`}
            style={{
              color: COLORS.white,
              background: isKey && on ? hl : "transparent",
              padding: "0 14px",
              borderRadius: 14,
              opacity: 0.35 + 0.65 * appear,
              transform: `translateY(${(1 - appear) * 18}px) scale(${0.92 + 0.08 * appear})`,
              textShadow: isKey && on ? "none" : "0 4px 18px rgba(0,0,0,0.55)",
              display: "inline-block",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{ t: number; fps: number; frame: number }> = ({ t, frame, fps }) => {
  const i = Math.max(0, T.findIndex((l, k) => t >= l.start - 0.4 && (k === T.length - 1 || t < T[k + 1].start - 0.4)));
  const line = LINES[i];
  if (i === T.length - 1) return null;
  const s = spring({ frame: frame - Math.round((T[i].start - 0.4) * fps), fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 44,
          color: COLORS.white,
          direction: "rtl",
          padding: "16px 36px",
          borderRadius: 999,
          background: "rgba(16,42,48,0.82)",
          border: `3px solid ${line.alert ? COLORS.magenta : COLORS.teal}`,
          transform: `scale(${0.85 + 0.15 * s})`,
          opacity: s,
        }}
      >
        {line.chip}
      </div>
    </div>
  );
};

// ---------- main ----------
export const Reel: React.FC<{ clay?: boolean }> = ({ clay }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = sec(frame, fps);

  // per-line progress

  const L = (i: number) => T[i].start;

  // smooth punch-in zoom on re-hooks (no shake)
  const punch = (i: number) => interpolate(t, [L(i) - 0.05, L(i) + 0.25, L(i) + 1.2], [0, 1, 0], clamp);
  const sh = 0;

  const cam = camAt(t);
  const intro = interpolate(t, [0, 0.6], [1.25, 1], { ...clamp, easing: ease });
  const camS = cam.s * intro * (1 + 0.08 * (punch(3) + punch(6)));
  const worldTf = `translate(${SAFE.cx + sh},${SAFE.cy}) scale(${camS}) translate(${-cam.at[0]},${-cam.at[1]})`;

  // freeze dim for rehook 1
  const rh1 = interpolate(t, [L(3), L(3) + 0.3, T[3].end, T[3].end + 0.4], [0, 1, 1, 0], clamp);
  const rh2 = interpolate(t, [L(6), L(6) + 0.3, T[6].end, T[6].end + 0.4], [0, 1, 1, 0], clamp);

  const press = interpolate(t, [0.35, 0.5, 0.7], [0, 1, 0], clamp);
  const sw = interpolate(t, [0.5, T[0].end], [0, 3], clamp);
  const swS = 0.8 * pop(frame, fps, 0.4) * interpolate(t, [T[1].start - 0.4, T[1].start], [1, 0], clamp);

  // path progress
  const tPS = prog(t, 1, 0.05, 0.5);
  const tSG = prog(t, 2, 0.3, 0.85);
  const tGH = prog(t, 4, 0.35, 0.85);
  const tHA = prog(t, 5, 0.05, 0.35);
  const back = prog(t, 7, 0.0, 0.45); // receipt flowing back
  const settle = prog(t, 7, 0.7, 1.0);

  const storeOpacity = 1 - 0.6 * rh1;
  const showAll = t > L(8) - 0.3;

  const pathsOn = (from: number) => (t >= L(from) ? 1 : 0);

  // receipt return path (bank A -> shaparak -> gateway -> store)
  const R_BACK: P2[] = [...[...R_HA].reverse(), ...[...R_GH].reverse(), ...[...R_SG].reverse()];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bg} 0%, ${COLORS.bgDeep} 75%)` }}>
      <Audio src={staticFile("vo.mp3")} />
      <Audio src={staticFile("bed.wav")} volume={0.5} />

      {clay && <ClayWorld />}
      {clay && swS > 0.01 && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(790,520) scale(1.25)">
            <Stopwatch value={sw} s={swS} />
          </g>
        </svg>
      )}
      {!clay && <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <g transform={worldTf} opacity={interpolate(t, [L(8) + 0.6, L(8) + 1.4], [1, 0.35], clamp)}>
          <Ground />

          {/* paths (drawn under objects) */}
          <Path p={R_AB} t={t >= L(6) ? 1 : 0} color={settle > 0 ? COLORS.teal : COLORS.magenta} dashed={settle <= 0} opacity={t >= L(6) ? 1 : 0} />
          <Path p={R_HA} t={showAll ? 1 : tHA} glow />
          <Path p={R_GH} t={showAll ? 1 : tGH} glow />
          <Path p={R_SG} t={showAll ? 1 : tSG} glow width={tSG > 0 && tSG < 1 ? 12 : 7} />
          <Path p={R_PS} t={showAll ? 1 : tPS} glow />

          {/* objects, back to front */}
          <Bank o={BANK_B} />
          <Bank o={BANK_A} />
          <Tower o={SHAP} frame={frame} active={pathsOn(4)} />
          <Building o={GATE} color={COLORS.petrol} />
          <Server o={STORE} opacity={storeOpacity} led={pathsOn(1)} frame={frame} />
          <Phone press={press} glow={press} />

          {/* dots */}
          <Dots p={R_PS} t={tPS < 1 ? tPS : 0} frame={frame} />
          <Dots p={R_SG} t={tSG < 1 ? tSG : 0} frame={frame} n={5} />
          <Dots p={R_HA} t={tHA < 1 ? tHA : 0} frame={frame} />
          {showAll && <Dots p={[...R_PS].reverse().concat(R_SG, R_GH, R_HA)} t={0.5} n={10} speed={0.012} frame={frame} />}

          {/* labels */}
          <Label at={top(PHONE, 0.2)} text="پرداخت" s={pop(frame, fps, 0.2) * (t < L(1) + 0.6 || showAll ? 1 : 0)} />
          <Label at={top(STORE, 0.3)} text="سرور فروشگاه" s={pop(frame, fps, L(1) + 0.3)} color={rh1 > 0.5 ? COLORS.magenta : COLORS.teal} />
          <Label at={top(GATE, 0.3)} text="درگاه پرداخت" s={pop(frame, fps, L(2) + T[2].end * 0 + (T[2].end - L(2)) * 0.75)} />
          <Label at={iso(SHAP.x + SHAP.w / 2, SHAP.y + SHAP.d / 2, SHAP.h + 1.75)} text="شاپرک" s={pop(frame, fps, L(4) + (T[4].end - L(4)) * 0.75)} />
          <Label at={top(BANK_A, 0.9)} text="بانک تو" s={pop(frame, fps, L(5) + 0.3)} />
          <Label at={top(BANK_B, 0.9)} text="بانک فروشنده" s={pop(frame, fps, L(6) + 0.6)} />

          {/* S1 stopwatch */}
          <g transform={`translate(${top(PHONE, 0)[0] + 150},${top(PHONE, 0)[1] - 250})`}>
            <Stopwatch value={sw} s={swS} />
          </g>

          {/* S2 invoice */}
          {(() => {
            const s = pop(frame, fps, L(1) + (T[1].end - L(1)) * 0.55) * (t < L(3) ? 1 : 0);
            const [x, y] = top(STORE, 1.9);
            return (
              <g transform={`translate(${x + 190},${y + 90 + Math.sin(t * 3) * 6}) scale(${s})`}>
                <IconInvoice />
              </g>
            );
          })()}

          {/* S3 token shield */}
          {(() => {
            const s = pop(frame, fps, L(2) + 0.2) * (t < L(4) ? 1 : 0);
            const [x, y] = top(STORE, 1.9);
            return (
              <g transform={`translate(${x - 150},${y + 40}) scale(${s})`}>
                <IconShield />
              </g>
            );
          })()}

          {/* S4 rehook: dashed magenta link store -> card, eye-slash */}
          {rh1 > 0 &&
            (() => {
              const a = top(STORE, 0.2);
              const b = top(GATE, 1.6);
              const m: P2 = mid(a, b);
              return (
                <g opacity={rh1}>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={COLORS.magenta} strokeWidth={7} strokeDasharray="20 16" strokeDashoffset={-frame * 2} />
                  <g transform={`translate(${b[0] + 40},${b[1]}) rotate(-8)`}>
                    <IconCard />
                  </g>
                  <g transform={`translate(${m[0]},${m[1]}) scale(${pop(frame, fps, L(3) + 0.3)})`}>
                    <IconEyeSlash />
                  </g>
                </g>
              );
            })()}

          {/* S5 card travels gateway -> shaparak as binary */}
          {(() => {
            const k = prog(t, 4, 0.05, 0.3);
            const [x, y] = top(GATE, 1.1);
            const s = interpolate(k, [0, 0.2, 0.85, 1], [0, 1, 1, 0], clamp);
            return (
              <g transform={`translate(${x},${y - 60 + k * 120}) scale(${s})`}>
                <IconCard />
              </g>
            );
          })()}
          {tGH > 0 && tGH < 1 && (
            <g>
              {new Array(8).fill(0).map((_, i) => {
                const u = (frame * 0.018 + i / 8) % 1;
                const [x, y] = pointAt(R_GH, u * Math.min(1, tGH * 1.5));
                return (
                  <text key={i} x={x} y={y - 26} textAnchor="middle" fontFamily="monospace" fontWeight={700} fontSize={34} fill={COLORS.tealLight}>
                    {(i * 7 + Math.floor(frame / 4)) % 2 ? "1" : "0"}
                  </text>
                );
              })}
            </g>
          )}

          {/* S6 checks + coin */}
          {(() => {
            const [x, y] = top(BANK_A, 1.8);
            const on = t < L(6) ? 1 : 0;
            return (
              <g transform={`translate(${x},${y})`}>
                {[0, 1, 2].map((i) => (
                  <g key={i} transform={`translate(${(i - 1) * 80},-60)`}>
                    <IconCheck s={pop(frame, fps, L(5) + (T[5].end - L(5)) * (0.35 + i * 0.2)) * on} />
                  </g>
                ))}
                <g transform={`translate(190,40) scale(${pop(frame, fps, L(5) + (T[5].end - L(5)) * 0.85) * on})`}>
                  <IconCoin minus />
                </g>
              </g>
            );
          })()}

          {/* S7 stop sign between banks */}
          {(() => {
            const m = pointAt(R_AB, 0.5);
            const s = pop(frame, fps, L(6) + 0.5) * (settle > 0 ? interpolate(settle, [0, 0.2], [1, 0], clamp) : 1) * (t >= L(6) ? 1 : 0);
            return (
              <g transform={`translate(${m[0]},${m[1] - 70}) scale(${s})`}>
                <IconStop />
              </g>
            );
          })()}

          {/* S8 receipt back + order + clock + settlement coin */}
          <Packet p={R_BACK} t={back}>
            <g transform="scale(1.1)">
              <IconInvoice />
            </g>
          </Packet>
          {(() => {
            const s = pop(frame, fps, L(7) + (T[7].end - L(7)) * 0.42) * (t < L(8) + 0.5 ? 1 : 0);
            const [x, y] = top(STORE, 1.2);
            return (
              <g transform={`translate(${x},${y - 40}) scale(${s * 1.3})`}>
                <IconOrder />
              </g>
            );
          })()}
          {(() => {
            const s = pop(frame, fps, L(7) + (T[7].end - L(7)) * 0.55) * (t < L(8) + 0.3 ? 1 : 0);
            const m = pointAt(R_AB, 0.5);
            const a = interpolate(t, [L(7) + (T[7].end - L(7)) * 0.55, T[7].end], [0, 720], clamp);
            return (
              <g transform={`translate(${m[0] + 150},${m[1] - 170}) scale(${s * 1.2})`}>
                <IconClock a={a} />
              </g>
            );
          })()}
          <Packet p={R_AB} t={settle} lift={50}>
            <IconCoin />
          </Packet>
        </g>
      </svg>}

      {/* rehook vignettes */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(204,51,102,${0.35 * Math.max(rh1, rh2)}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* S7 SMS notification */}
      {(() => {
        const s = spring({ frame: frame - Math.round((L(6) + 0.9) * fps), fps, config: { damping: 15 } });
        const out = interpolate(t, [T[6].end + 0.2, T[6].end + 0.6], [0, 1], clamp);
        if (t < L(6) || out >= 1) return null;
        return (
          <div
            style={{
              position: "absolute",
              opacity: 1 - out,
              top: 290 - out * 120 + (1 - s) * -300,
              left: 90,
              right: 90,
              padding: "28px 34px",
              borderRadius: 34,
              background: "rgba(248,250,252,0.96)",
              display: "flex",
              direction: "rtl",
              alignItems: "center",
              gap: 26,
              fontFamily: FONT,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ width: 84, height: 84, borderRadius: 22, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 46, fontWeight: 900 }}>
              ✉
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: COLORS.bgDeep }}>بانک · پیامک</div>
              <div style={{ fontSize: 32, fontWeight: 500, color: COLORS.slate }}>برداشت از حساب: ۱٬۲۵۰٬۰۰۰ ریال</div>
            </div>
          </div>
        );
      })()}

      {/* final: "< 3 seconds" -> question -> outro */}
      {(() => {
        if (t < L(8)) return null;
        const s = spring({ frame: frame - Math.round((L(8) + 0.5) * fps), fps, config: { damping: 14 } });
        const out = interpolate(t, [Q - 0.3, Q + 0.1], [1, 0], clamp);
        return (
          <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: s * out, transform: `scale(${(0.8 + 0.2 * s) * (1 - 0.15 * (1 - out))})` }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 124, color: COLORS.white, direction: "rtl", textShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", gap: 28 }}>
              <span>کمتر</span><span>از</span><span style={{ color: COLORS.tealLight }}>۳</span><span>ثانیه</span>
            </div>
          </div>
        );
      })()}
      {(() => {
        if (t < Q - 0.2) return null;
        const s = spring({ frame: frame - Math.round((Q + 0.1) * fps), fps, config: { damping: 12 } });
        const out = interpolate(t, [VE + 0.2, VE + 0.6], [1, 0], clamp);
        const bob = Math.sin(t * 7) * 14;
        return (
          <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, opacity: s * out, transform: `scale(${0.75 + 0.25 * s})` }}>
            <div style={{ width: 230, height: 190, borderRadius: 60, background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center", gap: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", position: "relative" }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: 30, height: 30, borderRadius: 15, background: COLORS.white, opacity: 0.4 + 0.6 * ((Math.sin(t * 8 - k * 1.2) + 1) / 2) }} />
              ))}
              <div style={{ position: "absolute", bottom: -34, right: 46, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: `40px solid ${COLORS.teal}` }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96, color: COLORS.white, direction: "rtl", textAlign: "center", lineHeight: 1.3, textShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
              تو کامنت‌ها
              <br />
              <span style={{ color: COLORS.tealLight }}>برامون بنویس</span>
            </div>
            <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: `translateY(${bob}px)` }}>
              <path d="M18,30 L45,58 L72,30" fill="none" stroke={COLORS.tealLight} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })()}
      {(() => {
        if (t < VE + 0.2) return null;
        const s = spring({ frame: frame - Math.round((VE + 0.45) * fps), fps, config: { damping: 13 } });
        const s2 = spring({ frame: frame - Math.round((VE + 0.9) * fps), fps, config: { damping: 15 } });
        return (
          <AbsoluteFill style={{ background: `rgba(16,42,48,${0.75 * s})`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
            <Img
              src={staticFile("logo.png")}
              style={{ width: 300, height: 300, borderRadius: 70, boxShadow: "0 24px 70px rgba(0,0,0,0.5)", transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -20}deg)`, opacity: s }}
            />
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, color: COLORS.white, opacity: s2, transform: `translateY(${(1 - s2) * 30}px)` }}>کامرسی</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: COLORS.soft, direction: "rtl", opacity: s2 * 0.9, transform: `translateY(${(1 - s2) * 30}px)` }}>
              پشت‌صحنه‌ی فروشگاه‌های آنلاین
            </div>
            <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: COLORS.white, direction: "rtl", padding: "16px 40px", borderRadius: 999, background: COLORS.teal, opacity: s2, transform: `scale(${0.8 + 0.2 * s2})` }}>
              برای قسمت بعد دنبالمون کن
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 36, color: COLORS.tealLight, letterSpacing: 2, opacity: s2 }}>ecommercy.ir</div>
          </AbsoluteFill>
        );
      })()}
      <AbsoluteFill style={{ background: COLORS.bgDeep, opacity: interpolate(t, [timings.total - 0.45, timings.total], [0, 1], clamp) }} />

      <Chip t={t} fps={fps} frame={frame} />
      <Captions t={t} />

      {/* small logo watermark */}
      <Img
        src={staticFile("logo.png")}
        style={{
          position: "absolute",
          left: 56,
          top: 70,
          width: 84,
          height: 84,
          borderRadius: 20,
          opacity: interpolate(t, [0.3, 0.9, L(8), L(8) + 0.5], [0, 0.9, 0.9, 0], clamp),
        }}
      />
    </AbsoluteFill>
  );
};
