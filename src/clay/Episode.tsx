import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dims, MatScope, Model, ObjSpec, P, Tree } from "./models";
import { Icon } from "./icons";

const FONT = "Lahzeh";
loadFont({ family: FONT, url: staticFile("Lahzeh-Medium.woff2"), weight: "500" });
loadFont({ family: FONT, url: staticFile("Lahzeh-Bold.woff2"), weight: "700" });
loadFont({ family: FONT, url: staticFile("Lahzeh-Black.woff2"), weight: "900" });

// ---------- types ----------
type RouteD = { from: string; to: string; at: [number, number]; color?: "alert"; dots?: number; until?: number; dashed?: boolean; pingpong?: boolean; big?: boolean };
type IconD = { icon: string; on: string; at: number; until?: number; dx?: number; dy?: number; dz?: number; s?: number; anim?: "float" | "spin" | "bounce" | "pulse" | "shake" | "swing" | "flip" | "orbit" | "none"; plate?: boolean };
type PacketD = { icon: string; from: string; to: string; at: [number, number] };
type QueueD = { from: string; to: string; n: number; at: number; until?: number };
type Directives = {
  cam?: string[];
  maxZoom?: number;
  routes?: RouteD[];
  icons?: IconD[];
  packets?: PacketD[];
  alert?: string[];
  dim?: string[];
  pulse?: string[];
  queue?: QueueD;
};
export type LineSpec = { text: string; say?: string; hideLabels?: boolean; chip: string; keys: string[]; alert?: boolean; do: Directives; sfx?: { name: string; at?: number; gain?: number; v?: number }[] };
export type EpisodeSpec = {
  id: string;
  title: string;
  question: string;
  finalBig: string[] | null;
  objects: ObjSpec[];
  lines: LineSpec[];
  theme?: ThemeSpec;
  iconPlates?: boolean;
  brand?: { name?: string; tagline?: string; cta?: string; site?: string };
  music?: string;
};
export type Timings = { lines: { start: number; end: number }[]; voEnd: number; qStart: number; total: number; hasAudio?: boolean };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
import { applyTheme, ThemeSpec } from "../kit/theme";
const COLORS = new Proxy({} as Record<string, string>, { get: (_t, k: string) => (k === "white" ? P.text : (P as any)[k]) });
const SAFE_CY = 760;

// ---------- geometry helpers ----------
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Seg = [THREE.Vector3, THREE.Vector3];
const routeSegs = (a: ObjSpec, b: ObjSpec): Seg[] => {
  const h = 0.06;
  return [
    [V(a.x, h, a.z), V(a.x, h, b.z)],
    [V(a.x, h, b.z), V(b.x, h, b.z)],
  ];
};
const segLen = (s: Seg[]) => s.reduce((acc, [p, q]) => acc + p.distanceTo(q), 0);
const pointOn = (s: Seg[], t: number) => {
  let L = segLen(s) * Math.max(0, Math.min(1, t));
  for (const [p, q] of s) {
    const d = p.distanceTo(q);
    if (L <= d) return p.clone().lerp(q, d === 0 ? 0 : L / d);
    L -= d;
  }
  return s[s.length - 1][1].clone();
};

const RouteMesh: React.FC<{ segs: Seg[]; t: number; color: string; dashed?: boolean; frame: number }> = ({ segs, t, color, dashed, frame }) => {
  if (t <= 0) return null;
  const total = segLen(segs);
  let left = total * Math.min(1, t);
  const parts: React.ReactNode[] = [];
  segs.forEach(([p, q], i) => {
    const d = p.distanceTo(q);
    const use = Math.max(0, Math.min(d, left));
    left -= d;
    if (use <= 0.001) return;
    const dir = q.clone().sub(p).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
    if (dashed) {
      const step = 0.45;
      const off = (frame * 0.02) % step;
      for (let s = off; s < use - 0.15; s += step) {
        const c = p.clone().add(dir.clone().multiplyScalar(s + 0.12));
        parts.push(
          <mesh key={`${i}-${s}`} position={c} quaternion={quat}>
            <capsuleGeometry args={[0.06, 0.16, 4, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.9} />
          </mesh>,
        );
      }
      return;
    }
    const end = p.clone().lerp(q, use / d);
    const mid = p.clone().add(end).multiplyScalar(0.5);
    parts.push(
      <mesh key={i} position={mid} quaternion={quat}>
        <capsuleGeometry args={[0.07, use, 6, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.9} />
      </mesh>,
    );
  });
  return <group>{parts}</group>;
};

const DotsMesh: React.FC<{ segs: Seg[]; n: number; frame: number; grow: number; pingpong?: boolean; big?: boolean; color: string }> = ({ segs, n, frame, grow, pingpong, big, color }) => (
  <group>
    {new Array(n).fill(0).map((_, i) => {
      let u = (frame * (big ? 0.012 : 0.02) + i / n) % 1;
      if (pingpong && i % 2) u = 1 - u;
      const p = pointOn(segs, u * Math.min(1, grow));
      const r = big ? 0.26 : 0.13;
      return (
        <mesh key={i} position={[p.x, p.y + r, p.z]}>
          <sphereGeometry args={[r, 18, 14]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.8} />
        </mesh>
      );
    })}
  </group>
);

// ---------- camera ----------
const ISO_DIR = V(1, 0.8165, 1).normalize();
const isoQuat = (() => {
  const c = new THREE.OrthographicCamera();
  c.position.copy(ISO_DIR.clone().multiplyScalar(30));
  c.lookAt(0, 0, 0);
  return c.quaternion.clone();
})();
const qInv = isoQuat.clone().invert();

const fitCam = (objs: ObjSpec[], maxZoom: number, W: number, H: number, iconOn: Set<string> = new Set()) => {
  let x0 = 1e9,
    x1 = -1e9,
    y0 = 1e9,
    y1 = -1e9;
  for (const o of objs) {
    const { w, d, h } = dims(o);
    for (const [x, y, z] of [
      [o.x - w / 2, 0, o.z - d / 2],
      [o.x + w / 2, 0, o.z - d / 2],
      [o.x - w / 2, 0, o.z + d / 2],
      [o.x + w / 2, 0, o.z + d / 2],
      [o.x, h + (iconOn.has(o.id) ? (o.label ? 3.3 : 2.7) : 1.9), o.z],
    ] as [number, number, number][]) {
      const v = V(x, y, z).applyQuaternion(qInv);
      x0 = Math.min(x0, v.x);
      x1 = Math.max(x1, v.x);
      y0 = Math.min(y0, v.y);
      y1 = Math.max(y1, v.y);
    }
  }
  const zoom = Math.min(maxZoom, (W * 0.74) / (x1 - x0), (H * 0.4) / (y1 - y0));
  const center = V((x0 + x1) / 2, (y0 + y1) / 2, 0).applyQuaternion(isoQuat);
  return { center, zoom };
};

const CamRig: React.FC<{ target: THREE.Vector3; zoom: number }> = ({ target, zoom }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.position.copy(target.clone().add(ISO_DIR.clone().multiplyScalar(30)));
    (camera as THREE.OrthographicCamera).zoom = zoom;
    camera.near = -100;
    camera.far = 200;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, target.x, target.y, target.z, zoom, invalidate]);
  return null;
};

// ---------- 2D overlays ----------
const Captions: React.FC<{ ep: EpisodeSpec; T: Timings["lines"]; t: number }> = ({ ep, T, t }) => {
  const i = T.findIndex((l) => t >= l.start - 0.1 && t <= l.end + 0.3);
  if (i < 0) return null;
  const line = ep.lines[i];
  const words = line.text.split(" ");
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
  const Wt = weights.reduce((a, b) => a + b, 0);
  const { start, end } = T[i];
  const dur = end - start;
  let acc = start,
    ci = chunks.length - 1,
    cS = start,
    cE = end;
  for (let k = 0; k < chunks.length; k++) {
    const d = (dur * weights[k]) / Wt;
    if (t < acc + d) {
      ci = k;
      cS = acc;
      cE = acc + d;
      break;
    }
    acc += d;
  }
  const chunk = chunks[ci];
  const local = interpolate(t, [cS, cE], [0, 1], clamp);
  const chars = chunk.map((w) => w.length + 1);
  const CW = chars.reduce((a, b) => a + b, 0);
  const hl = line.alert ? COLORS.magenta : COLORS.teal;
  let cAcc = 0;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1330, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 18px", direction: "rtl", fontFamily: FONT, fontWeight: 900, fontSize: 76, lineHeight: 1.25 }}>
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

const Chip: React.FC<{ ep: EpisodeSpec; T: Timings["lines"]; t: number; frame: number; fps: number }> = ({ ep, T, t, frame, fps }) => {
  const i = Math.max(0, T.findIndex((l, k) => t >= l.start - 0.4 && (k === T.length - 1 || t < T[k + 1].start - 0.4)));
  if (i === T.length - 1 && ep.finalBig) return null;
  const line = ep.lines[i];
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
export const Episode: React.FC<{ ep: EpisodeSpec; timings: Timings }> = ({ ep, timings }) => {
  applyTheme(ep.theme);
  const BR = { name: "کامرسی", tagline: "پشت‌صحنه‌ی فروشگاه‌های آنلاین", cta: "برای قسمت بعد دنبالمون کن", site: "ecommercy.ir", ...(ep.brand || {}) };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const T = timings.lines;
  const N = T.length;
  const L = (i: number) => T[Math.min(i, N - 1)].start;
  const D = (i: number) => T[i].end - T[i].start;
  const Q = timings.qStart;
  const VE = timings.voEnd;
  const TOT = timings.total;

  const byId = useMemo(() => Object.fromEntries(ep.objects.map((o) => [o.id, o])), [ep]);
  // current line index (switches 0.35s before the line starts)
  let cur = 0;
  for (let i = 0; i < N; i++) if (t >= T[i].start - 0.35) cur = i;
  const lp = (i: number, a: number) => T[i].start + D(i) * a;
  const pop = (at: number) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 11, stiffness: 170 } });
  const inWin = (i: number, until: number | undefined, fallback: number) => {
    const u = until ?? fallback;
    return t >= T[i].start - 0.35 && (u >= N || t < T[u].start - 0.35);
  };

  // ----- camera -----
  const cams = useMemo(
    () =>
      ep.lines.map((l) => {
        const ids = l.do.cam && l.do.cam.length ? l.do.cam : ep.objects.map((o) => o.id);
        const objs = ids.map((id) => byId[id]).filter(Boolean) as ObjSpec[];
        return fitCam(objs, 150 * (l.do.maxZoom ?? 1.25), width, height, new Set((l.do.icons ?? []).map((ic) => ic.on)));
      }),
    [ep, byId, width, height],
  );
  let camC = cams[0].center.clone();
  let camZ = cams[0].zoom;
  for (let i = 1; i < N; i++) {
    const st = T[i].start - 0.35;
    const k = interpolate(t, [st, st + 1.0], [0, 1], { ...clamp, easing: ease });
    if (k <= 0) break;
    camC = camC.clone().lerp(cams[i].center, k);
    camZ = camZ + (cams[i].zoom - camZ) * k;
  }
  // outro: pull back to everything
  const allCam = useMemo(() => fitCam(ep.objects, 150, width, height), [ep, width, height]);
  const outroK = interpolate(t, [VE + 0.1, VE + 1.2], [0, 1], { ...clamp, easing: ease });
  camC = camC.clone().lerp(allCam.center, outroK);
  camZ = camZ + (allCam.zoom * 0.85 - camZ) * outroK;
  const intro = interpolate(t, [0, 0.6], [1.25, 1], { ...clamp, easing: ease });
  let punch = 0;
  ep.lines.forEach((l, i) => {
    if (l.alert) punch += interpolate(t, [L(i) - 0.05, L(i) + 0.25, L(i) + 1.2], [0, 1, 0], clamp);
  });
  const zoom = camZ * intro * (1 + 0.08 * punch);
  const up = V(0, 1, 0).applyQuaternion(isoQuat);
  const target = camC.clone().add(up.multiplyScalar(-(height / 2 - SAFE_CY) / zoom));
  const camera = useMemo(() => {
    const c = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -100, 200);
    c.position.copy(target.clone().add(ISO_DIR.clone().multiplyScalar(30)));
    c.zoom = zoom;
    c.lookAt(target);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    return c;
  }, [width, height, target.x, target.y, target.z, zoom]);
  const proj = (v: THREE.Vector3) => {
    const p = v.clone().project(camera);
    return [(p.x * 0.5 + 0.5) * width, (-p.y * 0.5 + 0.5) * height] as [number, number];
  };

  // ----- per-object state -----
  const objState = (o: ObjSpec) => {
    const from = o.from ?? 0;
    const appear = from === 0 ? interpolate(t, [0, 0.4], [0.6, 1], clamp) : pop(L(from) - 0.15);
    let op = 1,
      glow = 0,
      pulse = 0;
    ep.lines.forEach((l, i) => {
      const inLine = t >= T[i].start - 0.35 && (i === N - 1 || t < T[i + 1].start - 0.35);
      if (l.do.dim?.includes(o.id)) {
        const k = interpolate(t, [T[i].start - 0.35, T[i].start + 0.1], [0, 1], clamp) * (inLine ? 1 : 0);
        op = Math.min(op, 1 - 0.65 * k);
      }
      if (l.do.alert?.includes(o.id) && inLine) glow = Math.max(glow, interpolate(t, [lp(i, 0.25), lp(i, 0.25) + 0.35], [0, 1], clamp));
      if (l.do.pulse?.includes(o.id) && inLine) pulse = Math.max(pulse, ((Math.sin((t - T[i].start) * 9) + 1) / 2) * interpolate(t, [T[i].start, T[i].start + 1.6], [1, 0], clamp));
    });
    return { appear, op, glow, pulse };
  };
  const tapFor = (o: ObjSpec) => {
    let tap = 0;
    ep.lines.forEach((l, i) => {
      if (l.do.pulse?.includes(o.id)) tap = Math.max(tap, interpolate(t, [T[i].start, T[i].start + 0.2, T[i].start + 0.6], [0, 1, 0], clamp));
    });
    if (o.type === "phone") tap = Math.max(tap, interpolate(t, [0.35, 0.5, 0.7], [0, 1, 0], clamp));
    return tap;
  };
  const topOf = (o: ObjSpec, extra = 1.0) => V(o.x, dims(o).h + extra, o.z);

  // ----- routes, dots, queues, packets, icons -----
  const routes: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  const icons: React.ReactNode[] = [];
  ep.lines.forEach((l, i) => {
    (l.do.routes ?? []).forEach((r, k) => {
      const a = byId[r.from],
        b = byId[r.to];
      if (!a || !b) return;
      if (!inWin(i, r.until, N)) return;
      const segs = routeSegs(a, b);
      const prog = interpolate(t, [lp(i, r.at[0]), lp(i, r.at[1]) + 0.001], [0, 1], { ...clamp, easing: ease });
      const color = r.color === "alert" ? P.alert : P.path;
      routes.push(<RouteMesh key={`r${i}-${k}`} segs={segs} t={prog} color={color} dashed={r.dashed} frame={frame} />);
      const lineActive = t >= T[i].start - 0.2 && t <= T[i].end + 0.2;
      if (r.dots && lineActive && prog > 0)
        dots.push(<DotsMesh key={`d${i}-${k}`} segs={segs} n={r.dots} frame={frame} grow={prog * 1.4} pingpong={r.pingpong} big={r.big} color={r.color === "alert" ? "#FFD3E0" : "#DFFBFE"} />);
    });
    if (l.do.queue) {
      const q = l.do.queue;
      const a = byId[q.from],
        b = byId[q.to];
      if (a && b && inWin(i, q.until, i + 1)) {
        const segs = routeSegs(a, b);
        const bd = dims(b);
        const stop = 1 - (Math.max(bd.w, bd.d) / 2 + 0.5) / segLen(segs);
        for (let n = 0; n < q.n; n++) {
          const s = pop(lp(i, q.at) + n * 0.12);
          if (s <= 0.01) continue;
          const p = pointOn(segs, Math.max(0, stop - n * (0.55 / segLen(segs))));
          icons.push(
            <group key={`q${i}-${n}`} position={[p.x, 0.35 + Math.sin(t * 6 + n) * 0.03, p.z]} scale={s * 0.55}>
              <group rotation={[0, Math.PI / 4, 0]}>
                <Icon name="box" />
              </group>
            </group>,
          );
        }
      }
    }
    (l.do.packets ?? []).forEach((pk, k) => {
      const a = byId[pk.from],
        b = byId[pk.to];
      if (!a || !b) return;
      const u = interpolate(t, [lp(i, pk.at[0]), lp(i, pk.at[1])], [0, 1], clamp);
      if (u <= 0 || u >= 1) return;
      const p = pointOn(routeSegs(a, b), ease(u));
      const s = interpolate(u, [0, 0.1, 0.9, 1], [0, 1, 1, 0], clamp);
      icons.push(
        <group key={`p${i}-${k}`} position={[p.x, 0.9, p.z]} scale={s * 1.2}>
          <group rotation={[0, Math.PI / 4, 0]}>
            <Icon name={pk.icon} />
          </group>
        </group>,
      );
    });
    // icons on the same object at the same time are spread sideways automatically
    const sameOn: Record<string, number[]> = {};
    (l.do.icons ?? []).forEach((ic, k) => {
      if (ic.dx === undefined) (sameOn[ic.on] ??= []).push(k);
    });
    (l.do.icons ?? []).forEach((ic, k) => {
      const o = byId[ic.on];
      if (!o) return;
      if (!inWin(i, ic.until, N)) return;
      const t0 = lp(i, ic.at);
      const s = pop(t0) * (ic.s ?? 1);
      if (s <= 0.01) return;
      const grp = sameOn[ic.on] ?? [];
      const autoDx = ic.dx === undefined && grp.length > 1 ? (grp.indexOf(k) - (grp.length - 1) / 2) * 1.1 : 0;
      const dx = (ic.dx ?? autoDx) * 1.75;
      // sit above the object's label so the label never covers the icon
      const at = topOf(o, 1.05 + (o.label ? 0.75 : 0) + (ic.dy ?? 0)).add(V(dx * 0.707, 0, -dx * 0.707)).add(V(0, 0, ic.dz ?? 0));
      const u = t - t0;
      const a = ic.anim ?? "float";
      let py = 0, ry = 0, rz = 0, sc = 1, px = 0;
      if (a === "float") py = Math.sin(t * 3 + k) * 0.06;
      else if (a === "spin") ry = u * 3;
      else if (a === "bounce") py = Math.abs(Math.sin(u * 5)) * 0.35;
      else if (a === "pulse") sc = 1 + 0.12 * Math.sin(u * 8);
      else if (a === "shake") px = Math.sin(u * 45) * 0.08 * Math.max(0.3, Math.min(1, 1.5 - u * 0.5));
      else if (a === "swing") rz = Math.sin(u * 6) * 0.35;
      else if (a === "flip") ry = interpolate(u, [0, 0.6], [Math.PI * 2, 0], { ...clamp, easing: ease });
      else if (a === "orbit") { px = Math.cos(u * 2.5) * 0.5; py = Math.sin(u * 2.5) * 0.25; }
      const plate = ic.plate ?? ep.iconPlates ?? true;
      icons.push(
        <group key={`i${i}-${k}`} position={[at.x + px * 0.707, at.y + py, at.z - px * 0.707]} scale={s * 1.45 * sc}>
          <group rotation={[0, Math.PI / 4, 0]}>
            {plate && (
              <mesh position={[0, 0, -0.32]} renderOrder={-1}>
                <circleGeometry args={[0.6, 48]} />
                <meshBasicMaterial color={P.chipBg} transparent opacity={0.92} depthWrite={false} />
              </mesh>
            )}
            <group rotation={[0, ry, rz]}>
              <Icon name={ic.icon} />
            </group>
          </group>
        </group>,
      );
    });
  });

  // ----- slab bounds & decor -----
  const bounds = useMemo(() => {
    let x0 = 1e9,
      x1 = -1e9,
      z0 = 1e9,
      z1 = -1e9;
    for (const o of ep.objects) {
      const { w, d } = dims(o);
      x0 = Math.min(x0, o.x - w / 2);
      x1 = Math.max(x1, o.x + w / 2);
      z0 = Math.min(z0, o.z - d / 2);
      z1 = Math.max(z1, o.z + d / 2);
    }
    return { x0: x0 - 1.6, x1: x1 + 1.6, z0: z0 - 1.6, z1: z1 + 1.6 };
  }, [ep]);
  const trees = useMemo(() => {
    const out: [number, number, number][] = [];
    let seed = ep.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < 60 && out.length < 9; k++) {
      const x = bounds.x0 + 0.6 + rnd() * (bounds.x1 - bounds.x0 - 1.2);
      const z = bounds.z0 + 0.6 + rnd() * (bounds.z1 - bounds.z0 - 1.2);
      const clear = ep.objects.every((o) => {
        const { w, d } = dims(o);
        return Math.abs(x - o.x) > w / 2 + 0.9 || Math.abs(z - o.z) > d / 2 + 0.9;
      });
      const offPath = ep.objects.every((o) => Math.abs(x - o.x) > 0.5 && Math.abs(z - o.z) > 0.5);
      if (clear && offPath) out.push([x, z, 0.75 + rnd() * 0.4]);
    }
    return out;
  }, [ep, bounds]);

  // ----- labels -----
  const labels = ep.objects
    .filter((o) => o.label)
    .map((o) => {
      const st = objState(o);
      const lf = o.labelFrom ?? o.from ?? 0;
      let s = lf ? pop(L(lf) + 0.2) : pop(0.25 + ep.objects.indexOf(o) * 0.12);
      if (o.labelUntil !== undefined && o.labelUntil < N) s *= 1 - pop(L(o.labelUntil) - 0.35);
      if (ep.lines[cur]?.hideLabels) s *= interpolate(t, [T[cur].start - 0.35, T[cur].start - 0.05], [1, 0], clamp);
      let alert = false;
      ep.lines.forEach((l, i) => {
        if (l.do.alert?.includes(o.id) && i === cur) alert = true;
      });
      return { o, s: s * (st.op < 0.6 ? 0.85 : 1), alert, at: topOf(o, 0.35) };
    });

  const vign = Math.max(
    0,
    ...ep.lines.map((l, i) => (l.alert ? interpolate(t, [L(i), L(i) + 0.3, T[i].end, T[i].end + 0.4], [0, 1, 1, 0], clamp) : 0)),
  );
  const worldFade = Math.min(
    interpolate(t, [Q - 0.3, Q + 0.3], [1, 0.4], clamp),
    ep.finalBig ? interpolate(t, [L(N - 1) + 0.2, L(N - 1) + 0.7], [1, 0.45], clamp) : 1,
  );
  const lastStart = L(N - 1);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${COLORS.bg} 0%, ${COLORS.bgDeep} 75%)` }}>
      {timings.hasAudio !== false && (
        <>
          <Audio src={staticFile(`${ep.id}/vo.wav`)} />
          <Audio src={staticFile(`${ep.id}/bed.wav`)} volume={0.5} />
        </>
      )}
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ position: "absolute", inset: 0, opacity: worldFade }}
      >
        <CamRig target={target} zoom={zoom} />
        <hemisphereLight args={["#DFF6FF", "#24434A", 0.9]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[target.x + 6, 14, target.z - 3]}
          target-position={[target.x, 0, target.z]}
          intensity={1.6}
          color="#FFF4E6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-radius={8}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[target.x - 8, 6, target.z + 8]} intensity={0.35} color="#BFE9F2" />

        <RoundedBox args={[bounds.x1 - bounds.x0, 0.8, bounds.z1 - bounds.z0]} radius={0.35} smoothness={6} position={[(bounds.x0 + bounds.x1) / 2, -0.4, (bounds.z0 + bounds.z1) / 2]} receiveShadow>
          <meshStandardMaterial color={P.slab} roughness={0.95} />
        </RoundedBox>
        <RoundedBox args={[bounds.x1 - bounds.x0 - 0.6, 0.06, bounds.z1 - bounds.z0 - 0.6]} radius={0.03} smoothness={3} position={[(bounds.x0 + bounds.x1) / 2, 0, (bounds.z0 + bounds.z1) / 2]} receiveShadow>
          <meshStandardMaterial color={P.tile} roughness={0.95} />
        </RoundedBox>
        {trees.map(([x, z, s], i) => (
          <Tree key={i} x={x} z={z} s={s} />
        ))}

        {routes}
        {dots}

        {ep.objects.map((o) => {
          const st = objState(o);
          if (st.appear <= 0.01) return null;
          return (
            <group key={o.id} position={[o.x, 0, o.z]} scale={st.appear}>
              <MatScope s={{ op: st.op, glow: st.glow, pulse: st.pulse }}>
                <Model o={o} t={t} tap={tapFor(o)} />
              </MatScope>
            </group>
          );
        })}
        {icons}
      </ThreeCanvas>

      {/* labels */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: worldFade }}>
        {labels.map((l, i) => {
          if (l.s <= 0.01) return null;
          const [x, y] = proj(l.at);
          const sc = Math.max(0.8, Math.min(1.15, zoom / 150));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%,-100%) scale(${l.s * sc})`,
                transformOrigin: "50% 100%",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 34,
                color: P.chipText,
                background: P.chipBg,
                padding: "10px 26px",
                borderRadius: 999,
                direction: "rtl",
                whiteSpace: "nowrap",
                boxShadow: `0 10px 24px rgba(0,0,0,0.35), inset 0 -4px 0 ${l.alert ? P.alert : P.btn}`,
              }}
            >
              {l.o.label}
            </div>
          );
        })}
      </div>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(204,51,102,${0.35 * vign}) 100%)`, pointerEvents: "none" }} />

      {/* final big statement (last line, before the question) */}
      {ep.finalBig &&
        t >= lastStart &&
        (() => {
          const s = spring({ frame: frame - Math.round((lastStart + 0.4) * fps), fps, config: { damping: 14 } });
          const out = interpolate(t, [Q - 0.3, Q + 0.1], [1, 0], clamp);
          if (out <= 0) return null;
          return (
            <div style={{ position: "absolute", top: 470, left: 40, right: 40, display: "flex", justifyContent: "center", opacity: s * out, transform: `scale(${(0.8 + 0.2 * s) * (1 - 0.15 * (1 - out))})` }}>
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: ep.finalBig.join(" ").length > 12 ? 96 : 124, color: COLORS.white, direction: "rtl", textShadow: "0 8px 30px rgba(0,0,0,0.45)", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px" }}>
                {ep.finalBig.map((w, k) => (
                  <span key={k} style={{ color: /[۰-۹0-9]/.test(w) || k === 0 ? COLORS.tealLight : COLORS.white }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

      {/* question card */}
      {ep.question && t >= Q - 0.2 &&
        (() => {
          const s = spring({ frame: frame - Math.round((Q + 0.1) * fps), fps, config: { damping: 12 } });
          const out = interpolate(t, [VE + 0.2, VE + 0.6], [1, 0], clamp);
          if (out <= 0) return null;
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

      <Chip ep={ep} T={T} t={t} frame={frame} fps={fps} />
      {t < VE + 0.35 && <Captions ep={ep} T={T} t={t} />}

      {/* outro */}
      {t >= VE + 0.2 &&
        (() => {
          const s = spring({ frame: frame - Math.round((VE + 0.45) * fps), fps, config: { damping: 13 } });
          const s2 = spring({ frame: frame - Math.round((VE + 0.9) * fps), fps, config: { damping: 15 } });
          return (
            <AbsoluteFill style={{ background: `${P.bgDeep}${Math.round(0.75 * s * 255).toString(16).padStart(2, "0")}`, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 30 }}>
              <Img src={staticFile("logo.png")} style={{ width: 300, height: 300, borderRadius: 70, boxShadow: "0 24px 70px rgba(0,0,0,0.5)", transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -20}deg)`, opacity: s }} />
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 92, color: COLORS.white, opacity: s2, transform: `translateY(${(1 - s2) * 30}px)` }}>{BR.name}</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: COLORS.soft, direction: "rtl", opacity: s2 * 0.9, transform: `translateY(${(1 - s2) * 30}px)` }}>{BR.tagline}</div>
              <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 700, fontSize: 40, color: COLORS.white, direction: "rtl", padding: "16px 40px", borderRadius: 999, background: COLORS.teal, opacity: s2, transform: `scale(${0.8 + 0.2 * s2})` }}>
                {BR.cta}
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 36, color: COLORS.tealLight, letterSpacing: 2, opacity: s2 }}>{BR.site}</div>
            </AbsoluteFill>
          );
        })()}

      <Img src={staticFile("logo.png")} style={{ position: "absolute", left: 56, top: 70, width: 84, height: 84, borderRadius: 20, opacity: interpolate(t, [0.3, 0.9, VE, VE + 0.5], [0, 0.9, 0.9, 0], clamp) }} />
      <AbsoluteFill style={{ background: COLORS.bgDeep, opacity: interpolate(t, [TOT - 0.45, TOT], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
