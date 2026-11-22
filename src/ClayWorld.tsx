import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { BANK_A, BANK_B, camAt, clamp, ease, FONT, GATE, Obj, PHONE, pop, prog, SAFE, SHAP, STORE, T } from "./Reel";
import { U, C30 } from "./iso";

// ---------- clay palette (matte pastel on dark) ----------
const P = {
  bg: "#12303A",
  slab: "#3B6D75",
  slabSide: "#2D5960",
  tile: "#447A82",
  path: "#7FDCE5",
  phone: "#EEF2F4",
  screen: "#2B535B",
  btn: "#5FD3DF",
  server: "#9AA3B8",
  serverDark: "#6F7890",
  led: "#8FF0F7",
  gate: "#A9DDE2",
  window: "#4E8E98",
  tower: "#BDB6E0",
  bank: "#F4E6C8",
  roof: "#86CDD5",
  pillar: "#FFF8EA",
  magenta: "#EC88A8",
  coin: "#F4D06F",
  white: "#FFFFFF",
  tree: "#8FD3A8",
  trunk: "#C9A27E",
};

const mat = (c: string, emissive?: string, ei = 0) => (
  <meshStandardMaterial color={c} roughness={0.92} metalness={0} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
);

// grid (x,y) -> three (X, Z); height -> Y
const W = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, y);

const Block: React.FC<{ o: { x: number; y: number; w: number; d: number }; z?: number; h: number; color: string; r?: number; emissive?: string; ei?: number; opacity?: number }> = ({
  o,
  z = 0,
  h,
  color,
  r = 0.12,
  emissive,
  ei,
}) => (
  <RoundedBox args={[o.w, h, o.d]} radius={Math.min(r, h / 2 - 0.001, o.w / 2 - 0.001, o.d / 2 - 0.001)} smoothness={4} position={[o.x + o.w / 2, z + h / 2, o.y + o.d / 2]} castShadow receiveShadow>
    {mat(color, emissive, ei)}
  </RoundedBox>
);

const Tree: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <group position={[x, 0, y]} scale={s}>
    <mesh position={[0, 0.25, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.09, 0.5, 12]} />
      {mat(P.trunk)}
    </mesh>
    <mesh position={[0, 0.72, 0]} castShadow>
      <sphereGeometry args={[0.34, 24, 18]} />
      {mat(P.tree)}
    </mesh>
    <mesh position={[0.16, 0.98, 0.05]} castShadow>
      <sphereGeometry args={[0.22, 24, 18]} />
      {mat(P.tree)}
    </mesh>
  </group>
);

const Phone: React.FC<{ press: number }> = ({ press }) => {
  const o = PHONE;
  return (
    <group>
      <Block o={o} h={o.h} color={P.phone} r={0.08} />
      <Block o={{ x: o.x + 0.1, y: o.y + 0.12, w: o.w - 0.2, d: o.d - 0.24 }} z={o.h - 0.02} h={0.04} color={P.screen} r={0.02} />
      <Block o={{ x: o.x + 0.22, y: o.y + 0.3, w: o.w - 0.44, d: 0.35 }} z={o.h + 0.01} h={0.04} color="#3D6870" r={0.02} />
      <Block o={{ x: o.x + 0.22, y: o.y + 0.8, w: o.w - 0.44, d: 0.35 }} z={o.h + 0.01} h={0.04} color="#3D6870" r={0.02} />
      <Block o={{ x: o.x + 0.22, y: o.y + 1.5, w: o.w - 0.44, d: 0.42 }} z={o.h + 0.01 - press * 0.03} h={0.09} color={P.btn} r={0.04} emissive={P.btn} ei={0.25 + press * 0.8} />
    </group>
  );
};

const Server: React.FC<{ o: Obj; frame: number; on: boolean; dim: number }> = ({ o, frame, on, dim }) => (
  <group>
    <Block o={o} h={o.h} color={dim > 0.5 ? "#7D8496" : P.server} r={0.16} />
    {[0, 1, 2, 3, 4].map((i) => (
      <group key={i}>
        <mesh position={[o.x + o.w + 0.005, 0.38 + i * 0.45, o.y + o.d / 2]}>
          <boxGeometry args={[0.02, 0.24, o.d - 0.34]} />
          {mat(P.serverDark)}
        </mesh>
        <mesh position={[o.x + o.w + 0.02, 0.38 + i * 0.45, o.y + 0.3]}>
          <sphereGeometry args={[0.06, 16, 12]} />
          {mat(P.led, P.led, on ? 0.6 + 0.6 * ((Math.sin(frame / 3 + i * 1.7) + 1) / 2) : 0.2)}
        </mesh>
        <mesh position={[o.x + o.w / 2, 0.38 + i * 0.45, o.y + o.d + 0.005]}>
          <boxGeometry args={[o.w - 0.34, 0.24, 0.02]} />
          {mat(P.serverDark)}
        </mesh>
      </group>
    ))}
  </group>
);

const Building: React.FC<{ o: Obj }> = ({ o }) => (
  <group>
    <Block o={o} h={o.h} color={P.gate} r={0.18} />
    <Block o={{ x: o.x + 0.2, y: o.y + 0.2, w: o.w - 0.4, d: o.d - 0.4 }} z={o.h - 0.05} h={0.22} color="#C6EAEE" r={0.08} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <group key={`${r}${c}`}>
          <mesh position={[o.x + o.w + 0.01, 0.5 + r * 0.5, o.y + 0.45 + c * 0.55]}>
            <boxGeometry args={[0.04, 0.28, 0.32]} />
            {mat(P.window, P.led, 0.15)}
          </mesh>
          <mesh position={[o.x + 0.45 + c * 0.55, 0.5 + r * 0.5, o.y + o.d + 0.01]}>
            <boxGeometry args={[0.32, 0.28, 0.04]} />
            {mat(P.window, P.led, 0.1)}
          </mesh>
        </group>
      )),
    )}
  </group>
);

const Tower: React.FC<{ o: Obj; frame: number; on: boolean }> = ({ o, frame, on }) => (
  <group>
    <Block o={o} h={o.h} color={P.tower} r={0.2} />
    <Block o={{ x: o.x + 0.35, y: o.y + 0.35, w: o.w - 0.7, d: o.d - 0.7 }} z={o.h - 0.05} h={0.6} color="#D3CEEE" r={0.12} />
    {new Array(6).fill(0).map((_, i) => (
      <mesh key={i} position={[o.x + o.w + 0.01, 0.5 + i * 0.55, o.y + o.d / 2]}>
        <boxGeometry args={[0.03, 0.09, o.d - 0.5]} />
        {mat(P.led, P.led, on ? 0.3 + 0.9 * ((Math.sin(frame / 4 - i) + 1) / 2) : 0.15)}
      </mesh>
    ))}
    <mesh position={[o.x + o.w / 2, o.h + 0.95, o.y + o.d / 2]} castShadow>
      <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
      {mat("#E9E6F7")}
    </mesh>
    <mesh position={[o.x + o.w / 2, o.h + 1.4, o.y + o.d / 2]}>
      <sphereGeometry args={[0.13, 20, 16]} />
      {mat(P.led, P.led, on ? 0.8 + 0.5 * Math.sin(frame / 3) : 0.3)}
    </mesh>
  </group>
);

const roofGeo = (w: number, d: number, h: number) => {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4 });
  g.translate(0, 0, -w / 2);
  g.rotateY(Math.PI / 2);
  return g;
};

const Bank: React.FC<{ o: Obj }> = ({ o }) => {
  const geo = useMemo(() => roofGeo(o.w + 0.1, o.d + 0.2, 0.75), [o]);
  return (
    <group>
      <Block o={{ x: o.x - 0.15, y: o.y - 0.15, w: o.w + 0.3, d: o.d + 0.3 }} h={0.2} color="#E6D3AE" r={0.06} />
      <Block o={o} z={0.2} h={o.h - 0.2} color={P.bank} r={0.1} />
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[o.x + 0.3 + i * ((o.w - 0.6) / 3), 0.2 + (o.h - 0.2) / 2, o.y + o.d + 0.1]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, o.h - 0.25, 16]} />
          {mat(P.pillar)}
        </mesh>
      ))}
      <mesh geometry={geo} position={[o.x + o.w / 2, o.h, o.y + o.d / 2]} castShadow>
        {mat(P.roof)}
      </mesh>
    </group>
  );
};

// L-shaped route on the ground as clay tubes
type Seg = [THREE.Vector3, THREE.Vector3];
const routeSegs = (a: Obj, b: Obj): Seg[] => {
  const ax = a.x + a.w / 2,
    ay = a.y + a.d / 2,
    bx = b.x + b.w / 2,
    by = b.y + b.d / 2;
  const h = 0.06;
  return [
    [W(ax, ay, h), W(ax, by, h)],
    [W(ax, by, h), W(bx, by, h)],
  ];
};
const segLen = (s: Seg[]) => s.reduce((a, [p, q]) => a + p.distanceTo(q), 0);
const pointOn = (s: Seg[], t: number) => {
  let L = segLen(s) * Math.max(0, Math.min(1, t));
  for (const [p, q] of s) {
    const d = p.distanceTo(q);
    if (L <= d) return p.clone().lerp(q, d === 0 ? 0 : L / d);
    L -= d;
  }
  return s[s.length - 1][1].clone();
};

const Route: React.FC<{ segs: Seg[]; t: number; color?: string; ei?: number }> = ({ segs, t, color = P.path, ei = 0.55 }) => {
  if (t <= 0) return null;
  const total = segLen(segs);
  let left = total * Math.min(1, t);
  return (
    <group>
      {segs.map(([p, q], i) => {
        const d = p.distanceTo(q);
        const use = Math.max(0, Math.min(d, left));
        left -= d;
        if (use <= 0.001) return null;
        const end = p.clone().lerp(q, use / d);
        const mid = p.clone().add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(p).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <capsuleGeometry args={[0.07, use, 6, 12]} />
            {mat(color, color, ei)}
          </mesh>
        );
      })}
    </group>
  );
};

const Dots: React.FC<{ segs: Seg[]; t: number; frame: number; n?: number; color?: string }> = ({ segs, t, frame, n = 4, color = "#DFFBFE" }) => {
  if (t <= 0 || t >= 1) return null;
  return (
    <group>
      {new Array(n).fill(0).map((_, i) => {
        const u = ((frame * 0.02 + i / n) % 1) * Math.min(1, t * 1.6);
        const p = pointOn(segs, u);
        return (
          <mesh key={i} position={[p.x, p.y + 0.12, p.z]}>
            <sphereGeometry args={[0.13, 20, 16]} />
            {mat(color, color, 0.9)}
          </mesh>
        );
      })}
    </group>
  );
};

// floating clay icons
const Float: React.FC<{ at: THREE.Vector3; s: number; t: number; children: React.ReactNode; rot?: number }> = ({ at, s, t, children, rot = 0 }) =>
  s <= 0.001 ? null : (
    <group position={[at.x, at.y + Math.sin(t * 3) * 0.06, at.z]} scale={s * 1.5} rotation={[0, Math.PI / 4 + rot, 0]}>
      {children}
    </group>
  );

const Invoice = () => (
  <group rotation={[0, 0, 0]}>
    <RoundedBox args={[0.7, 0.9, 0.1]} radius={0.04} smoothness={4} castShadow>
      {mat(P.white)}
    </RoundedBox>
    <RoundedBox args={[0.7, 0.18, 0.12]} radius={0.04} smoothness={4} position={[0, 0.36, 0]}>
      {mat(P.btn)}
    </RoundedBox>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[-0.05 * (i === 2 ? 2 : 0), 0.08 - i * 0.16, 0.06]}>
        <boxGeometry args={[i === 2 ? 0.3 : 0.48, 0.06, 0.02]} />
        {mat("#9FB6BC")}
      </mesh>
    ))}
  </group>
);
const Shield = () => (
  <group>
    <mesh castShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.14, 6]} />
      {mat(P.btn, P.btn, 0.2)}
    </mesh>
    <RoundedBox args={[0.26, 0.22, 0.2]} radius={0.04} smoothness={4} position={[0, -0.02, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
      {mat("#1F4950")}
    </RoundedBox>
  </group>
);
const Card: React.FC<{ color?: string }> = ({ color = P.btn }) => (
  <group>
    <RoundedBox args={[0.9, 0.56, 0.08]} radius={0.05} smoothness={4} castShadow>
      {mat(color)}
    </RoundedBox>
    <mesh position={[-0.22, -0.08, 0.05]}>
      <boxGeometry args={[0.2, 0.14, 0.02]} />
      {mat(P.coin)}
    </mesh>
  </group>
);
const EyeSlash = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.14, 40]} />
      {mat(P.magenta, P.magenta, 0.2)}
    </mesh>
    <mesh position={[0, 0, 0.08]} rotation={[0, 0, 0]} scale={[1, 0.55, 1]}>
      <torusGeometry args={[0.24, 0.05, 12, 32]} />
      {mat(P.white)}
    </mesh>
    <mesh position={[0, 0, 0.09]}>
      <sphereGeometry args={[0.08, 16, 12]} />
      {mat(P.white)}
    </mesh>
    <mesh position={[0, 0, 0.12]} rotation={[0, 0, -Math.PI / 4]}>
      <capsuleGeometry args={[0.045, 0.6, 4, 8]} />
      {mat(P.white)}
    </mesh>
  </group>
);
const Check = () => (
  <group>
    <mesh castShadow>
      <sphereGeometry args={[0.26, 24, 18]} />
      {mat(P.led, P.led, 0.3)}
    </mesh>
    <mesh position={[-0.06, -0.02, 0.24]} rotation={[0, 0, Math.PI / 4]}>
      <capsuleGeometry args={[0.035, 0.1, 4, 8]} />
      {mat("#1F4950")}
    </mesh>
    <mesh position={[0.05, 0.03, 0.24]} rotation={[0, 0, -Math.PI / 5]}>
      <capsuleGeometry args={[0.035, 0.22, 4, 8]} />
      {mat("#1F4950")}
    </mesh>
  </group>
);
const Coin = () => (
  <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
    <cylinderGeometry args={[0.32, 0.32, 0.1, 40]} />
    {mat(P.coin, P.coin, 0.15)}
  </mesh>
);
const Stop = () => (
  <group>
    <mesh rotation={[Math.PI / 2, Math.PI / 8, 0]} castShadow>
      <cylinderGeometry args={[0.46, 0.46, 0.12, 8]} />
      {mat(P.magenta, P.magenta, 0.25)}
    </mesh>
    <RoundedBox args={[0.5, 0.14, 0.06]} radius={0.03} smoothness={3} position={[0, 0, 0.08]}>
      {mat(P.white)}
    </RoundedBox>
  </group>
);
const Order = () => (
  <group>
    <RoundedBox args={[1.0, 0.56, 0.1]} radius={0.12} smoothness={4} castShadow>
      {mat(P.white)}
    </RoundedBox>
    <mesh position={[-0.26, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.04, 24]} />
      {mat(P.btn)}
    </mesh>
    <mesh position={[0.15, 0.08, 0.06]}>
      <boxGeometry args={[0.4, 0.07, 0.02]} />
      {mat("#5F7F86")}
    </mesh>
    <mesh position={[0.08, -0.08, 0.06]}>
      <boxGeometry args={[0.26, 0.07, 0.02]} />
      {mat("#A9BEC3")}
    </mesh>
  </group>
);

const CamRig: React.FC<{ target: THREE.Vector3; zoom: number }> = ({ target, zoom }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    const d = 30;
    camera.position.set(target.x + d, target.y + d * 0.8165, target.z + d);
    (camera as THREE.OrthographicCamera).zoom = zoom;
    camera.near = -100;
    camera.far = 200;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, target.x, target.y, target.z, zoom, invalidate]);
  return null;
};

// ---------- camera (true isometric ortho) ----------
const isoCamera = (width: number, height: number, target: THREE.Vector3, zoom: number) => {
  const cam = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -100, 200);
  const d = 30;
  cam.position.set(target.x + d, target.y + d * 0.8165, target.z + d);
  cam.zoom = zoom;
  cam.lookAt(target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return cam;
};

export const ClayWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const L = (i: number) => T[i].start;

  // camera: reuse 2D cam targets (screen-space at ground) -> ground point
  const c = camAt(t);
  const gx = c.at[0] / (U * C30); // x - y
  const gy = c.at[1] / (U * 0.5); // x + y
  const wx = (gx + gy) / 2;
  const wy = (gy - gx) / 2;
  const punch = (i: number) => interpolate(t, [L(i) - 0.05, L(i) + 0.25, L(i) + 1.2], [0, 1, 0], clamp);
  const intro = interpolate(t, [0, 0.6], [1.25, 1], { ...clamp, easing: ease });
  const zoom = c.s * U * 1.3 * intro * (1 + 0.08 * (punch(3) + punch(6)));
  // shift so the target lands at SAFE center (canvas center is 960)
  const target = W(wx, wy, 0);
  const cam = useMemo(() => isoCamera(width, height, target, zoom), [width, height, target.x, target.z, zoom]);
  // offset target vertically for SAFE.cy (760 vs 960 center): move camera up in screen space
  const dyPx = height / 2 - SAFE.cy;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const target2 = target.clone().add(up.multiplyScalar(-dyPx / zoom));
  const camera = useMemo(() => isoCamera(width, height, target2, zoom), [width, height, target2.x, target2.y, target2.z, zoom]);

  const rh1 = interpolate(t, [L(3), L(3) + 0.3, T[3].end, T[3].end + 0.4], [0, 1, 1, 0], clamp);
  const press = interpolate(t, [0.35, 0.5, 0.7], [0, 1, 0], clamp);
  const tPS = prog(t, 1, 0.05, 0.5);
  const tSG = prog(t, 2, 0.3, 0.85);
  const tGH = prog(t, 4, 0.35, 0.85);
  const tHA = prog(t, 5, 0.05, 0.35);
  const back = prog(t, 7, 0.0, 0.45);
  const settle = prog(t, 7, 0.7, 1.0);
  const showAll = t > L(8) - 0.3;

  const R = useMemo(
    () => ({
      PS: routeSegs(PHONE, STORE),
      SG: routeSegs(STORE, GATE),
      GH: routeSegs(GATE, SHAP),
      HA: routeSegs(SHAP, BANK_A),
      AB: routeSegs(BANK_A, BANK_B),
    }),
    [],
  );
  const BACK: Seg[] = useMemo(() => {
    const rev = (s: Seg[]) => [...s].reverse().map(([a, b]) => [b, a] as Seg);
    return [...rev(R.HA), ...rev(R.GH), ...rev(R.SG)];
  }, [R]);

  const topOf = (o: Obj, extra = 0.8) => W(o.x + o.w / 2, o.y + o.d / 2, o.h + extra);

  // 2D label overlay positions
  const proj = (v: THREE.Vector3) => {
    const p = v.clone().project(camera);
    return [(p.x * 0.5 + 0.5) * width, (-p.y * 0.5 + 0.5) * height] as [number, number];
  };
  const labels: { at: THREE.Vector3; text: string; s: number; alert?: boolean }[] = [
    { at: topOf(PHONE, 0.3), text: "پرداخت", s: pop(frame, fps, 0.2) * (t < L(1) + 0.6 || showAll ? 1 : 0) },
    { at: topOf(STORE, 0.3), text: "سرور فروشگاه", s: pop(frame, fps, L(1) + 0.3), alert: rh1 > 0.5 },
    { at: topOf(GATE, 0.4), text: "درگاه پرداخت", s: pop(frame, fps, L(2) + (T[2].end - L(2)) * 0.75) },
    { at: topOf(SHAP, 1.8), text: "شاپرک", s: pop(frame, fps, L(4) + (T[4].end - L(4)) * 0.75) },
    { at: topOf(BANK_A, 1.0), text: "بانک تو", s: pop(frame, fps, L(5) + 0.3) },
    { at: topOf(BANK_B, 1.0), text: "بانک فروشنده", s: pop(frame, fps, L(6) + 0.6) },
  ];

  const sp = (at: number) => pop(frame, fps, at);
  const D = (i: number) => T[i].end - T[i].start;
  const midAB = pointOn(R.AB, 0.5);

  return (
    <>
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ position: "absolute", inset: 0, opacity: interpolate(t, [L(8) + 0.6, L(8) + 1.4], [1, 0.4], clamp) }}
      >
        <CamRig target={target2} zoom={zoom} />
        <hemisphereLight args={["#DFF6FF", "#24434A", 0.9]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[target2.x + 6, 14, target2.z - 3]}
          target-position={[target2.x, 0, target2.z]}
          intensity={1.6}
          color="#FFF4E6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-radius={8}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[target2.x - 8, 6, target2.z + 8]} intensity={0.35} color="#BFE9F2" />

        {/* diorama slab */}
        <RoundedBox args={[12.6, 0.8, 18.9]} radius={0.35} smoothness={6} position={[-1.5, -0.4, -5.35]} receiveShadow>
          {mat(P.slab)}
        </RoundedBox>
        <RoundedBox args={[12.0, 0.06, 18.3]} radius={0.03} smoothness={3} position={[-1.5, 0.0, -5.35]} receiveShadow>
          {mat(P.tile)}
        </RoundedBox>

        {/* decor */}
        <Tree x={3.6} y={2.6} />
        <Tree x={-6.5} y={2.2} s={0.8} />
        <Tree x={-6.6} y={-4.2} s={1.1} />
        <Tree x={3.8} y={-7.5} s={0.9} />
        <Tree x={-1.2} y={-13.4} s={0.85} />
        <Tree x={3.9} y={-13.2} />
        <Tree x={-0.6} y={-5.6} s={0.7} />

        {/* routes */}
        <Route segs={R.AB} t={t >= L(6) ? 1 : 0} color={settle > 0 ? P.path : P.magenta} />
        <Route segs={R.HA} t={showAll ? 1 : tHA} />
        <Route segs={R.GH} t={showAll ? 1 : tGH} />
        <Route segs={R.SG} t={showAll ? 1 : tSG} />
        <Route segs={R.PS} t={showAll ? 1 : tPS} />
        <Dots segs={R.PS} t={tPS < 1 ? tPS : 0} frame={frame} />
        <Dots segs={R.SG} t={tSG < 1 ? tSG : 0} frame={frame} n={5} />
        <Dots segs={R.GH} t={tGH < 1 ? tGH : 0} frame={frame} n={6} />
        <Dots segs={R.HA} t={tHA < 1 ? tHA : 0} frame={frame} />

        {/* objects */}
        <Bank o={BANK_B} />
        <Bank o={BANK_A} />
        <Tower o={SHAP} frame={frame} on={t >= L(4)} />
        <Building o={GATE} />
        <Server o={STORE} frame={frame} on={t >= L(1)} dim={rh1} />
        <Phone press={press} />

        {/* icons */}
        <Float at={topOf(STORE, 1.3).add(new THREE.Vector3(0.9, 0, -0.9))} s={sp(L(1) + D(1) * 0.55) * (t < L(3) ? 1 : 0)} t={t}>
          <Invoice />
        </Float>
        <Float at={topOf(STORE, 1.3).add(new THREE.Vector3(-0.9, 0, 0.9))} s={sp(L(2) + 0.2) * (t < L(4) ? 1 : 0)} t={t}>
          <Shield />
        </Float>
        {rh1 > 0 && (
          <>
            <Float at={topOf(STORE, 0.2).lerp(topOf(GATE, 0.2), 0.5).add(new THREE.Vector3(0, 0.6, 0))} s={sp(L(3) + 0.3) * rh1} t={t}>
              <EyeSlash />
            </Float>
            <Float at={topOf(GATE, 1.4)} s={rh1} t={t} rot={0.3}>
              <Card />
            </Float>
          </>
        )}
        {(() => {
          const k = prog(t, 4, 0.05, 0.3);
          const s = interpolate(k, [0, 0.2, 0.85, 1], [0, 1, 1, 0], clamp);
          return (
            <Float at={topOf(GATE, 1.4 - k * 1.2)} s={s} t={t}>
              <Card />
            </Float>
          );
        })()}
        {[0, 1, 2].map((i) => (
          <Float key={i} at={topOf(BANK_A, 1.9).add(new THREE.Vector3(-0.55 + i * 0.55, 0, 0.55 - i * 0.55))} s={sp(L(5) + D(5) * (0.35 + i * 0.2)) * (t < L(6) ? 1 : 0)} t={t + i}>
            <Check />
          </Float>
        ))}
        <Float at={topOf(BANK_A, 0.9).add(new THREE.Vector3(1.6, 0, 0))} s={sp(L(5) + D(5) * 0.85) * (t < L(6) ? 1 : 0)} t={t}>
          <Coin />
        </Float>
        <Float at={new THREE.Vector3(midAB.x, 1.0, midAB.z)} s={sp(L(6) + 0.5) * (t >= L(6) ? 1 : 0) * (settle > 0 ? interpolate(settle, [0, 0.2], [1, 0], clamp) : 1)} t={t}>
          <Stop />
        </Float>
        {back > 0 && back < 1 && (
          <Float at={(() => { const p = pointOn(BACK, ease(back)); return new THREE.Vector3(p.x, 0.9, p.z); })()} s={1.1} t={t}>
            <Invoice />
          </Float>
        )}
        <Float at={topOf(STORE, 1.2)} s={sp(L(7) + D(7) * 0.42) * (t < L(8) + 0.5 ? 1.3 : 0)} t={t}>
          <Order />
        </Float>
        {settle > 0 && settle < 1 && (
          <Float at={(() => { const p = pointOn(R.AB, ease(settle)); return new THREE.Vector3(p.x, 0.7, p.z); })()} s={1} t={t}>
            <Coin />
          </Float>
        )}
      </ThreeCanvas>

      {/* 2D labels projected from 3D */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: interpolate(t, [L(8) + 0.6, L(8) + 1.4], [1, 0.4], clamp) }}>
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
                color: "#173A41",
                background: "#F4FBFC",
                padding: "10px 26px",
                borderRadius: 999,
                direction: "rtl",
                whiteSpace: "nowrap",
                boxShadow: `0 10px 24px rgba(0,0,0,0.35), inset 0 -4px 0 ${l.alert ? P.magenta : P.btn}`,
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </>
  );
};

