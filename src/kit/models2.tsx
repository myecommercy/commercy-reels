// Extra clay models. Conventions: centred on (0,0), sitting on y=0, footprint w (x) × d (z), height h (y).
// The camera looks from +x+z, so faces/screens/labels go on the +x and +z sides (or rotate the group by π/4).
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, P, RB } from "../clay/models";

type S = { w: number; d: number; h: number; t: number; mood?: string; n?: number; c?: string };

const Cyl: React.FC<{ r: number; h: number; x?: number; y?: number; z?: number; c: string; rot?: [number, number, number]; seg?: number; e?: string; ei?: number; r2?: number }> = ({ r, r2, h, x = 0, y = 0, z = 0, c, rot, seg = 32, e, ei }) => (
  <mesh position={[x, y, z]} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    <M c={c} e={e} ei={ei} />
  </mesh>
);
const Ball: React.FC<{ r: number; x?: number; y?: number; z?: number; c: string; e?: string; ei?: number; sx?: number; sy?: number; sz?: number }> = ({ r, x = 0, y = 0, z = 0, c, e, ei, sx = 1, sy = 1, sz = 1 }) => (
  <mesh position={[x, y, z]} scale={[sx, sy, sz]} castShadow receiveShadow>
    <sphereGeometry args={[r, 32, 24]} />
    <M c={c} e={e} ei={ei} />
  </mesh>
);
const Tor: React.FC<{ r: number; tube: number; x?: number; y?: number; z?: number; c: string; rot?: [number, number, number]; arc?: number }> = ({ r, tube, x = 0, y = 0, z = 0, c, rot, arc = Math.PI * 2 }) => (
  <mesh position={[x, y, z]} rotation={rot} castShadow>
    <torusGeometry args={[r, tube, 12, 40, arc]} />
    <M c={c} />
  </mesh>
);
const Diag: React.FC<{ children: React.ReactNode }> = ({ children }) => <group rotation={[0, Math.PI / 4, 0]}>{children}</group>;

// ---------------- helpers ----------------
const Pad: React.FC<S> = ({ w, c }) => <Cyl r={w / 2} h={0.12} y={0.06} c={c ?? P.tile} seg={40} />;
const Spot: React.FC<S> = () => <group />;

// ---------------- devices ----------------
const Laptop: React.FC<S> = ({ w, d }) => (
  <Diag>
    <RB w={w} h={0.12} d={d} y={0.06} c={P.metal} r={0.05} />
    <RB w={w * 0.8} h={0.02} d={d * 0.45} y={0.13} z={-d * 0.05} c={P.serverDark} r={0.01} />
    <group position={[0, 0.12, -d / 2]} rotation={[-0.25, 0, 0]}>
      <RB w={w} h={d * 0.95} d={0.08} y={d * 0.47} c={P.metal} r={0.05} />
      <RB w={w * 0.88} h={d * 0.8} d={0.02} y={d * 0.48} z={0.05} c={P.screen} e={P.led} ei={0.15} r={0.01} />
    </group>
  </Diag>
);
const Monitor: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w * 0.4} h={0.08} d={0.5} y={0.04} c={P.metal} r={0.04} />
    <RB w={0.12} h={h * 0.35} d={0.12} y={h * 0.2} c={P.metal} r={0.04} />
    <RB w={w} h={h * 0.62} d={0.14} y={h * 0.66} c={P.serverDark} r={0.06} />
    <RB w={w * 0.92} h={h * 0.54} d={0.02} y={h * 0.67} z={0.08} c={P.screen} e={P.led} ei={0.15} r={0.01} />
  </Diag>
);
const Tablet: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.phone} r={0.08} />
    <RB w={w - 0.16} h={0.03} d={d - 0.16} y={h} c={P.screen} e={P.led} ei={0.1} r={0.02} />
  </group>
);
const Router: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h * 0.35} d={d} y={h * 0.18} c={P.white} r={0.12} />
    {[-0.3, 0.3].map((x) => <Cyl key={x} r={0.05} h={h * 0.7} x={x * w} y={h * 0.6} z={-d * 0.3} c={P.white} />)}
    {[0, 1, 2, 3].map((i) => <Ball key={i} r={0.045} x={-w * 0.3 + i * w * 0.2} y={h * 0.2} z={d / 2} c={P.led} e={P.led} ei={0.4 + 0.5 * ((Math.sin(t * 7 + i) + 1) / 2)} />)}
  </group>
);
const Camera: React.FC<S> = ({ w, h }) => (
  <group>
    <Cyl r={0.08} h={h * 0.6} y={h * 0.3} c={P.metal} />
    <group position={[0, h * 0.7, 0]} rotation={[0, Math.PI / 4, -0.25]}>
      <RB w={w} h={w * 0.45} d={w * 0.45} c={P.white} r={0.08} />
      <Cyl r={w * 0.16} h={0.1} x={w / 2} rot={[0, 0, Math.PI / 2]} c={P.dark} />
      <Ball r={0.05} x={w / 2 + 0.02} y={w * 0.18} c={P.alert} e={P.alert} ei={0.8} />
    </group>
  </group>
);
const Battery: React.FC<S> = ({ w, d, h, n = 0.7 }) => {
  const lvl = Math.max(0.05, Math.min(1, n));
  const cc = lvl < 0.25 ? P.danger : lvl < 0.5 ? P.warn : P.ok;
  return (
    <group>
      <RB w={w} h={h} d={d} y={h / 2} c={P.white} r={0.12} />
      <RB w={w * 0.4} h={0.12} d={d * 0.4} y={h + 0.05} c={P.white} r={0.04} />
      <RB w={w + 0.02} h={(h - 0.2) * lvl} d={d * 0.7} y={0.1 + ((h - 0.2) * lvl) / 2} c={cc} e={cc} ei={0.25} r={0.06} />
    </group>
  );
};

// ---------------- infrastructure ----------------
const Cloud: React.FC<S> = ({ w, h, t }) => {
  const b = Math.sin(t * 1.5) * 0.06;
  return (
    <group position={[0, h * 0.5 + b, 0]}>
      <Ball r={w * 0.28} c={P.white} />
      <Ball r={w * 0.22} x={-w * 0.28} y={-w * 0.06} c={P.white} />
      <Ball r={w * 0.22} x={w * 0.28} y={-w * 0.06} c={P.white} />
      <Ball r={w * 0.18} z={w * 0.18} x={w * 0.1} y={-w * 0.08} c={P.white} />
    </group>
  );
};
const Globe: React.FC<S> = ({ w, t }) => (
  <group position={[0, w * 0.55, 0]}>
    <group rotation={[0.3, t * 0.6, 0]}>
      <Ball r={w * 0.45} c={P.roof} />
      {[0.2, -0.15].map((y, i) => <Ball key={i} r={w * 0.15} y={y * w} x={w * 0.33} sx={0.5} c={P.ok} />)}
      <Ball r={w * 0.17} z={w * 0.33} y={-0.05 * w} sz={0.5} c={P.ok} />
    </group>
    <Tor r={w * 0.55} tube={0.03} rot={[Math.PI / 2.3, 0, 0.3]} c={P.white} />
  </group>
);
const Rack: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.serverDark} r={0.1} />
    {new Array(Math.max(3, Math.floor(h / 0.32))).fill(0).map((_, i) => (
      <group key={i}>
        <RB w={0.03} h={0.2} d={d - 0.2} x={w / 2} y={0.25 + i * 0.32} c={P.server} r={0.01} />
        <Ball r={0.04} x={w / 2 + 0.02} y={0.25 + i * 0.32} z={d / 2 - 0.2} c={P.led} e={P.led} ei={0.4 + 0.6 * ((Math.sin(t * 11 + i * 2.1) + 1) / 2)} />
      </group>
    ))}
  </group>
);
const Datacenter: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={0.12} d={d} y={0.06} c={P.dark} r={0.05} />
    {[0, 1, 2].map((r) => [0, 1].map((c) => (
      <group key={`${r}${c}`} position={[-w / 2 + w / 6 + r * (w / 3), 0.12, -d / 4 + c * (d / 2)]}>
        <Rack w={w / 4} d={d / 3} h={h} t={t + r + c} />
      </group>
    )))}
  </group>
);
const LoadBalancer: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.accent2} r={0.2} />
    {[-1, 0, 1].map((k) => <RB key={k} w={0.04} h={0.12} d={d * 0.18} x={w / 2} y={h * 0.5 + k * 0.25} c={P.led} e={P.led} ei={0.3 + 0.5 * ((Math.sin(t * 6 + k) + 1) / 2)} r={0.02} />)}
    <group position={[0, h + 0.3, 0]} rotation={[0, t * 1.2, 0]}>
      {[0, 1, 2].map((k) => <RB key={k} w={0.7} h={0.08} d={0.12} rot={[0, (k * Math.PI * 2) / 3, 0]} c={P.white} r={0.03} />)}
    </group>
  </group>
);
const Firewall: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    {new Array(4).fill(0).map((_, r) => new Array(4).fill(0).map((__, c) => (
      <RB key={`${r}${c}`} w={w / 4 - 0.04} h={h / 4 - 0.04} d={d} x={-w / 2 + w / 8 + c * (w / 4) + (r % 2 ? w / 16 : 0) - w / 32} y={h / 8 + r * (h / 4)} c={(r + c) % 3 === 0 ? "#D98B6F" : "#E3A083"} r={0.04} />
    )))}
    {[-0.3, 0, 0.3].map((x, i) => <Ball key={i} r={0.2 + 0.05 * Math.sin(t * 8 + i)} x={x * w} y={h + 0.15} sy={1.6} c={P.warn} e={P.warn} ei={0.8} />)}
  </group>
);
const Queue: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={0.15} d={d} y={0.08} c={P.serverDark} r={0.06} />
    {new Array(5).fill(0).map((_, i) => <RB key={i} w={w / 6} h={h * 0.5} d={d * 0.7} x={-w / 2 + w / 10 + ((i / 5 + t * 0.15) % 1) * (w * 0.8)} y={0.15 + h * 0.25} c={[P.coin, P.alert, P.ok, P.accent2, P.btn][i]} r={0.06} />)}
  </group>
);
const Container: React.FC<S> = ({ w, d, h, c }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={c ?? P.btn} r={0.06} />
    {new Array(6).fill(0).map((_, i) => <RB key={i} w={0.04} h={h * 0.8} d={d + 0.02} x={-w / 2 + w / 7 + (i * w) / 7} y={h / 2} c={P.dark} r={0.01} />)}
  </group>
);
const Antenna: React.FC<S> = ({ w, h, t }) => (
  <group>
    <Cyl r={w * 0.4} r2={0.05} h={h} y={h / 2} c={P.metal} seg={4} />
    <Ball r={0.12} y={h + 0.05} c={P.alert} e={P.alert} ei={0.5 + 0.5 * Math.sin(t * 5)} />
    {[1, 2].map((k) => <Tor key={k} r={0.25 * k + 0.2 * ((t * 1.5) % 1)} tube={0.025} y={h + 0.05} rot={[0, Math.PI / 4, 0]} arc={Math.PI} c={P.led} />)}
  </group>
);
const Satellite: React.FC<S> = ({ w, t }) => (
  <group position={[0, 1.6 + Math.sin(t * 1.5) * 0.08, 0]} rotation={[0, Math.PI / 4, 0.2]}>
    <RB w={0.6} h={0.6} d={0.6} c={P.coin} r={0.08} />
    {[-1, 1].map((s) => <RB key={s} w={w * 0.5} h={0.04} d={0.5} x={s * (0.3 + w * 0.25)} c={P.window} e={P.led} ei={0.15} r={0.02} />)}
    <Cyl r={0.25} r2={0.05} h={0.2} y={0.4} c={P.white} />
  </group>
);

// ---------------- web / wordpress ----------------
const Browser: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w} h={h} d={0.14} y={h / 2 + 0.1} c={P.white} r={0.08} />
    <RB w={w} h={h * 0.13} d={0.16} y={h * 0.93 + 0.1} c={P.server} r={0.06} />
    {[0, 1, 2].map((i) => <Ball key={i} r={0.05} x={-w / 2 + 0.18 + i * 0.15} y={h * 0.93 + 0.1} z={0.09} c={[P.danger, P.warn, P.ok][i]} />)}
    <RB w={w * 0.55} h={0.1} d={0.02} x={0.1} y={h * 0.93 + 0.1} z={0.09} c={P.white} r={0.03} />
    <RB w={w * 0.85} h={h * 0.3} d={0.02} y={h * 0.62 + 0.1} z={0.08} c={P.gate} r={0.02} />
    {[0, 1].map((i) => <RB key={i} w={w * (i ? 0.5 : 0.85)} h={0.06} d={0.02} x={i ? -w * 0.17 : 0} y={h * (0.36 - i * 0.12) + 0.1} z={0.08} c={P.server} r={0.02} />)}
  </Diag>
);
const Terminal: React.FC<S> = ({ w, h, t }) => (
  <Diag>
    <RB w={w} h={h} d={0.14} y={h / 2 + 0.1} c={P.dark} r={0.08} />
    {[0, 1, 2, 3].map((i) => <RB key={i} w={w * [0.6, 0.4, 0.7, 0.3][i] * (i === 3 ? (t * 2) % 1 : 1)} h={0.06} d={0.02} x={-w / 2 + 0.12 + (w * [0.6, 0.4, 0.7, 0.3][i] * (i === 3 ? (t * 2) % 1 : 1)) / 2} y={h * 0.8 - i * h * 0.17 + 0.1} z={0.08} c={i % 2 ? P.coin : P.ok} e={P.ok} ei={0.2} r={0.02} />)}
  </Diag>
);
const Form: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w} h={h} d={0.12} y={h / 2 + 0.1} c={P.paper} r={0.06} />
    {[0, 1, 2].map((i) => <RB key={i} w={w * 0.8} h={h * 0.13} d={0.03} y={h * 0.78 - i * h * 0.22 + 0.1} z={0.07} c={P.white} r={0.03} />)}
    <RB w={w * 0.5} h={h * 0.13} d={0.05} y={h * 0.14 + 0.1} z={0.07} c={P.btn} e={P.btn} ei={0.2} r={0.04} />
  </Diag>
);
const AdminPanel: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w} h={h} d={0.14} y={h / 2 + 0.1} c={P.white} r={0.08} />
    <RB w={w * 0.25} h={h * 0.95} d={0.16} x={-w * 0.375} y={h / 2 + 0.1} c="#23282D" r={0.06} />
    {[0, 1, 2, 3, 4].map((i) => <RB key={i} w={w * 0.16} h={0.05} d={0.02} x={-w * 0.375} y={h * 0.85 - i * h * 0.14 + 0.1} z={0.09} c={i === 1 ? P.btn : "#8C9399"} r={0.02} />)}
    {[0, 1, 2].map((i) => <RB key={"c" + i} w={w * 0.18} h={h * 0.25} d={0.03} x={-w * 0.07 + i * w * 0.21} y={h * 0.72 + 0.1} z={0.08} c={[P.gate, P.coin, P.alert][i]} r={0.03} />)}
    <RB w={w * 0.62} h={h * 0.32} d={0.03} x={w * 0.14} y={h * 0.3 + 0.1} z={0.08} c={P.soft === "#173A41" ? P.gate : "#E8EEF2"} r={0.03} />
  </Diag>
);
const Folder: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w * 0.4} h={h * 0.15} d={0.1} x={-w * 0.3} y={h + 0.02} c="#E8B85C" r={0.04} />
    <RB w={w} h={h} d={0.12} y={h / 2 + 0.05} c="#F4C96B" r={0.06} />
  </Diag>
);

// ---------------- money ----------------
const Bank: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={0.2} d={d} y={0.1} c={P.pillar} r={0.05} />
    <RB w={w - 0.2} h={0.12} d={d - 0.2} y={0.26} c={P.pillar} r={0.04} />
    {[-0.35, -0.12, 0.12, 0.35].map((x) => <Cyl key={x} r={0.1} h={h * 0.6} x={x * w} y={0.32 + h * 0.3} z={d / 2 - 0.25} c={P.white} />)}
    <RB w={w - 0.3} h={h * 0.6} d={d - 0.7} y={0.32 + h * 0.3} z={-0.2} c={P.cream} r={0.05} />
    <RB w={w} h={0.15} d={d} y={0.32 + h * 0.6 + 0.07} c={P.pillar} r={0.04} />
    <mesh position={[0, 0.32 + h * 0.6 + 0.15, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <cylinderGeometry args={[0.01, d * 0.55, 0.5, 4, 1]} />
      <M c={P.white} />
    </mesh>
  </group>
);
const Card: React.FC<S> = ({ w, d, c }) => (
  <Diag>
    <RB w={w} h={d * 0.63} d={0.08} y={d * 0.32 + 0.15} c={c ?? P.primary} r={0.08} rot={[-0.35, 0, 0]} />
    <group rotation={[-0.35, 0, 0]} position={[0, d * 0.32 + 0.15, 0]}>
      <RB w={w * 0.18} h={d * 0.14} d={0.02} x={-w * 0.28} y={0.03} z={0.05} c={P.coin} r={0.02} />
      <RB w={w * 0.7} h={0.05} d={0.02} y={-d * 0.15} z={0.05} c={P.white} r={0.02} />
    </group>
  </Diag>
);
const Pos: React.FC<S> = ({ w, d, h, t }) => (
  <Diag>
    <RB w={w} h={h} d={d * 0.5} y={h / 2} c={P.serverDark} r={0.1} rot={[-0.3, 0, 0]} />
    <group rotation={[-0.3, 0, 0]}>
      <RB w={w * 0.7} h={h * 0.3} d={0.02} y={h * 0.75} z={d * 0.26} c={P.screen} e={P.ok} ei={0.2 + 0.2 * Math.sin(t * 4)} r={0.02} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <RB key={`${r}${c}`} w={w * 0.18} h={h * 0.1} d={0.03} x={(c - 1) * w * 0.24} y={h * (0.45 - r * 0.14)} z={d * 0.26} c={P.white} r={0.02} />))}
    </group>
  </Diag>
);
const Wallet: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c="#B5734F" r={0.14} />
    <RB w={w * 0.45} h={h * 0.4} d={0.1} x={w * 0.2} y={h * 0.55} z={d / 2} c="#9A5E3E" r={0.06} />
    <Cyl r={0.06} h={0.05} x={w * 0.3} y={h * 0.55} z={d / 2 + 0.06} rot={[Math.PI / 2, 0, 0]} c={P.coin} />
    <RB w={w * 0.8} h={0.08} d={d * 0.7} y={h + 0.04} x={-0.05} c={P.ok} r={0.03} />
  </group>
);
const Safe: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.metal} r={0.12} />
    <RB w={0.04} h={h * 0.8} d={d * 0.8} x={w / 2} y={h / 2} c={P.server} r={0.02} />
    <group position={[w / 2 + 0.05, h / 2, 0]} rotation={[t * 0.8, 0, 0]}>
      <Cyl r={0.22} h={0.08} rot={[0, 0, Math.PI / 2]} c={P.serverDark} />
      {[0, 1, 2].map((k) => <RB key={k} w={0.05} h={0.5} d={0.06} x={0.05} rot={[(k * Math.PI) / 3, 0, 0]} c={P.white} r={0.02} />)}
    </group>
  </group>
);
const CoinStack: React.FC<S> = ({ w, n = 5 }) => (
  <group>
    {new Array(Math.max(1, Math.round(n))).fill(0).map((_, i) => <Cyl key={i} r={w * 0.45} h={0.16} x={Math.sin(i * 2.3) * 0.04} y={0.08 + i * 0.17} c={P.coin} e={P.coin} ei={0.15} />)}
  </group>
);
const Piggy: React.FC<S> = ({ w, h }) => (
  <group position={[0, h * 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
    <Ball r={w * 0.42} sx={1.2} c="#F5B5C6" />
    <Cyl r={w * 0.14} h={0.15} x={w * 0.52} rot={[0, 0, Math.PI / 2]} c="#EE9FB4" />
    {[-1, 1].map((s) => <Ball key={s} r={w * 0.1} x={w * 0.25} y={w * 0.35} z={s * w * 0.2} c="#EE9FB4" />)}
    {[[-0.25, -0.2], [-0.25, 0.2], [0.25, -0.2], [0.25, 0.2]].map(([x, z], i) => <Cyl key={i} r={w * 0.08} h={h * 0.4} x={x * w} y={-w * 0.4} z={z * w} c="#EE9FB4" />)}
    <RB w={0.3} h={0.04} d={0.08} y={w * 0.42} c={P.dark} r={0.01} />
  </group>
);
const Receipt: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w} h={h} d={0.05} y={h / 2 + 0.1} c={P.paper} r={0.02} />
    {[0, 1, 2, 3, 4].map((i) => <RB key={i} w={w * (i === 4 ? 0.4 : 0.7)} h={0.04} d={0.02} x={i === 4 ? w * 0.15 : 0} y={h * 0.85 - i * h * 0.15 + 0.1} z={0.03} c={i === 4 ? P.dark : P.server} r={0.01} />)}
  </Diag>
);
const Gift: React.FC<S> = ({ w, d, h, c }) => (
  <group>
    <RB w={w} h={h * 0.75} d={d} y={h * 0.375} c={c ?? P.alert} r={0.08} />
    <RB w={w + 0.08} h={h * 0.18} d={d + 0.08} y={h * 0.8} c={c ?? P.alert} r={0.06} />
    <RB w={w * 0.18} h={h * 0.95} d={d + 0.1} y={h * 0.47} c={P.coin} r={0.03} />
    <RB w={w + 0.1} h={h * 0.95} d={d * 0.18} y={h * 0.47} c={P.coin} r={0.03} />
    {[-1, 1].map((s) => <Tor key={s} r={w * 0.16} tube={0.06} x={s * w * 0.15} y={h + 0.1} rot={[0, Math.PI / 4, s * 0.6]} c={P.coin} />)}
  </group>
);
const Tag: React.FC<S> = ({ w, h, c }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape();
    const a = w / 2, b = h / 2;
    s.moveTo(-a, -b); s.lineTo(a * 0.4, -b); s.lineTo(a, 0); s.lineTo(a * 0.4, b); s.lineTo(-a, b); s.closePath();
    const hole = new THREE.Path(); hole.absarc(a * 0.45, 0, 0.09, 0, Math.PI * 2, true); s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
    geo.translate(0, 0, -0.05);
    return geo;
  }, [w, h]);
  return (
    <group position={[0, h / 2 + 0.3, 0]} rotation={[0, Math.PI / 4, 0.15]}>
      <mesh geometry={g} castShadow><M c={c ?? P.accent} /></mesh>
      <RB w={w * 0.45} h={0.07} d={0.02} x={-w * 0.15} y={0.08} z={0.09} c={P.white} r={0.02} />
      <RB w={w * 0.3} h={0.07} d={0.02} x={-w * 0.22} y={-0.08} z={0.09} c={P.white} r={0.02} />
    </group>
  );
};

// ---------------- store & logistics ----------------
const Store: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.cream} r={0.1} />
    {new Array(6).fill(0).map((_, i) => <RB key={i} w={w / 6} h={0.12} d={0.6} x={-w / 2 + w / 12 + (i * w) / 6} y={h * 0.78} z={d / 2 + 0.25} rot={[0.4, 0, 0]} c={i % 2 ? P.white : P.alert} r={0.03} />)}
    <RB w={w * 0.35} h={h * 0.5} d={0.04} x={-w * 0.2} y={h * 0.28} z={d / 2 + 0.01} c={P.window} e={P.led} ei={0.1} r={0.02} />
    <RB w={w * 0.22} h={h * 0.55} d={0.04} x={w * 0.25} y={h * 0.28} z={d / 2 + 0.01} c={P.wood} r={0.02} />
    <RB w={w * 0.6} h={h * 0.16} d={0.06} y={h + 0.15} z={d / 2 - 0.1} c={P.primary} r={0.04} />
  </group>
);
const Cart3: React.FC<S> = ({ w, d, h, n = 2 }) => (
  <Diag>
    <RB w={w} h={0.06} d={d} y={h * 0.4} c={P.metal} r={0.03} />
    <RB w={w} h={h * 0.5} d={0.06} y={h * 0.65} z={d / 2} c={P.metal} r={0.03} />
    <RB w={w} h={h * 0.5} d={0.06} y={h * 0.65} z={-d / 2} c={P.metal} r={0.03} />
    <RB w={0.06} h={h * 0.5} d={d} x={-w / 2} y={h * 0.65} c={P.metal} r={0.03} />
    <RB w={0.06} h={h * 0.5} d={d} x={w / 2} y={h * 0.65} c={P.metal} r={0.03} />
    <RB w={0.08} h={h * 0.3} d={0.08} x={-w / 2 - 0.1} y={h * 1.0} c={P.metal} r={0.03} />
    <RB w={0.4} h={0.1} d={d * 0.8} x={-w / 2 - 0.2} y={h * 1.12} c={P.alert} r={0.04} />
    {[[-0.3, -0.35], [-0.3, 0.35], [0.3, -0.35], [0.3, 0.35]].map(([x, z], i) => <Cyl key={i} r={0.1} h={0.06} x={x * w} y={0.1} z={z * d} rot={[Math.PI / 2, 0, 0]} c={P.rubber} />)}
    {new Array(Math.min(4, Math.round(n))).fill(0).map((_, i) => <RB key={"p" + i} w={w * 0.3} h={h * 0.35} d={d * 0.35} x={-w * 0.25 + (i % 2) * w * 0.45} y={h * 0.6} z={(i < 2 ? -1 : 1) * d * 0.2} c={[P.coin, P.ok, P.accent2, P.btn][i]} r={0.05} />)}
  </Diag>
);
const Shelf: React.FC<S> = ({ w, d, h }) => (
  <group>
    {[0, 1, 2].map((k) => <RB key={k} w={w} h={0.08} d={d} y={0.1 + (k * (h - 0.2)) / 2} c={P.wood} r={0.03} />)}
    {[-1, 1].map((s) => <RB key={s} w={0.08} h={h} d={d} x={(s * (w - 0.08)) / 2} y={h / 2} c={P.wood} r={0.03} />)}
    {[0, 1].map((k) => new Array(3).fill(0).map((_, i) => <RB key={`${k}${i}`} w={w * 0.22} h={(h - 0.4) / 2 - 0.1} d={d * 0.7} x={-w * 0.3 + i * w * 0.3} y={0.14 + (k * (h - 0.2)) / 2 + ((h - 0.4) / 2 - 0.1) / 2} c={["#D9B98C", "#E6C9A0", "#C9A27E"][(i + k) % 3]} r={0.04} />))}
  </group>
);
const Box: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c="#D9B98C" r={0.06} />
    <RB w={w * 0.2} h={0.02} d={d + 0.02} y={h} c="#C9A27E" r={0.01} />
    <RB w={w * 0.35} h={h * 0.25} d={0.02} x={w * 0.15} y={h * 0.45} z={d / 2} c={P.paper} r={0.01} />
  </group>
);
const Pallet: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={0.18} d={d} y={0.09} c={P.wood} r={0.03} />
    {[0, 1].map((r) => [0, 1].map((c) => [0, 1].map((l) => <RB key={`${r}${c}${l}`} w={w * 0.46} h={(h - 0.2) / 2 - 0.04} d={d * 0.46} x={(c - 0.5) * w * 0.48} y={0.2 + l * ((h - 0.2) / 2) + ((h - 0.2) / 2 - 0.04) / 2} z={(r - 0.5) * d * 0.48} c={(r + c + l) % 2 ? "#D9B98C" : "#E6C9A0"} r={0.04} />)))}
  </group>
);
const Conveyor: React.FC<S> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={0.18} d={d} y={h} c={P.serverDark} r={0.06} />
    {[-0.4, 0, 0.4].map((x) => <RB key={x} w={0.1} h={h} d={0.1} x={x * w} y={h / 2} c={P.metal} r={0.03} />)}
    {[0, 1, 2, 3].map((i) => <RB key={"b" + i} w={0.4} h={0.35} d={d * 0.6} x={((t * 0.4 + i / 4) % 1) * w - w / 2} y={h + 0.27} c="#D9B98C" r={0.04} />)}
  </group>
);
const Forklift: React.FC<S> = ({ w, d, h }) => (
  <Diag>
    <RB w={w * 0.6} h={h * 0.45} d={d} x={-w * 0.1} y={h * 0.32} c={P.warn} r={0.08} />
    <RB w={w * 0.4} h={0.05} d={d * 0.9} x={-w * 0.15} y={h * 0.95} c={P.dark} r={0.02} />
    {[-1, 1].map((s) => <RB key={s} w={0.05} h={h * 0.4} d={0.05} x={-w * 0.3} y={h * 0.75} z={s * d * 0.4} c={P.dark} r={0.02} />)}
    <RB w={0.08} h={h} d={d * 0.6} x={w * 0.25} y={h * 0.5} c={P.metal} r={0.03} />
    {[-1, 1].map((s) => <RB key={"f" + s} w={w * 0.35} h={0.05} d={0.08} x={w * 0.45} y={h * 0.2} z={s * d * 0.2} c={P.metal} r={0.02} />)}
    {[[-0.3, -0.5], [-0.3, 0.5], [0.15, -0.5], [0.15, 0.5]].map(([x, z], i) => <Cyl key={i} r={0.14} h={0.1} x={x * w} y={0.14} z={z * d} rot={[Math.PI / 2, 0, 0]} c={P.rubber} />)}
  </Diag>
);
const Bike: React.FC<S> = ({ w, h, t }) => (
  <Diag>
    {[-1, 1].map((s) => <Tor key={s} r={0.2} tube={0.07} x={s * w * 0.35} y={0.27} c={P.rubber} rot={[0, 0, t * -8]} />)}
    <RB w={w * 0.6} h={0.2} d={0.25} y={0.45} c={P.alert} r={0.08} />
    <RB w={0.4} h={0.36} d={0.4} x={-w * 0.28} y={0.78} c={P.coin} r={0.06} />
    <RB w={0.08} h={0.4} d={0.08} x={w * 0.3} y={0.65} rot={[0, 0, -0.3]} c={P.metal} r={0.03} />
    <Ball r={0.17} x={0.02} y={h * 0.95} c={P.white} />
    <RB w={0.22} h={0.42} d={0.24} x={0.02} y={h * 0.62} c={P.primary} r={0.08} />
  </Diag>
);
const Drone: React.FC<S> = ({ w, t }) => (
  <group position={[0, 1.4 + Math.sin(t * 2.5) * 0.1, 0]}>
    <RB w={0.5} h={0.18} d={0.5} c={P.white} r={0.08} />
    {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
      <group key={i} position={[x * w * 0.35, 0.05, z * w * 0.35]}>
        <RB w={0.06} h={0.05} d={0.06} c={P.metal} r={0.02} />
        <RB w={0.45} h={0.02} d={0.06} y={0.06} rot={[0, t * 30 + i, 0]} c={P.dark} r={0.01} />
      </group>
    ))}
    {[[0.18, 0.18], [-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18]].map(([x, z], i) => <RB key={"a" + i} w={0.05} h={0.05} d={w * 0.5} x={x} z={z} rot={[0, Math.PI / 4 + (i < 2 ? 0 : Math.PI / 2), 0]} c={P.metal} r={0.02} />)}
    <RB w={0.32} h={0.3} d={0.32} y={-0.32} c="#D9B98C" r={0.04} />
  </group>
);
const Mailbox: React.FC<S> = ({ w, d, h }) => (
  <group>
    <Cyl r={0.06} h={h * 0.55} y={h * 0.27} c={P.wood} />
    <RB w={w} h={h * 0.35} d={d} y={h * 0.72} c={P.primary} r={0.15} />
    <RB w={0.05} h={0.35} d={0.12} x={w / 2} y={h * 0.95} z={-d * 0.3} c={P.alert} r={0.02} />
  </group>
);

// ---------------- people ----------------
const Person: React.FC<S> = ({ w, h, t, mood = "neutral", c }) => {
  const body = c ?? P.primary;
  const hy = h * 0.82;
  const bob = mood === "happy" ? Math.abs(Math.sin(t * 6)) * 0.08 : mood === "angry" ? Math.sin(t * 30) * 0.015 : 0;
  const mouth = (() => {
    if (mood === "happy") return <Tor r={0.07} tube={0.02} y={hy - 0.06} z={w * 0.36} rot={[0, 0, Math.PI]} arc={Math.PI} c={P.dark} />;
    if (mood === "angry" || mood === "sad") return <Tor r={0.07} tube={0.02} y={hy - 0.12} z={w * 0.36} arc={Math.PI} c={P.dark} />;
    if (mood === "surprised") return <Ball r={0.05} y={hy - 0.08} z={w * 0.37} sz={0.4} c={P.dark} />;
    return <RB w={0.12} h={0.03} d={0.02} y={hy - 0.08} z={w * 0.37} c={P.dark} r={0.01} />;
  })();
  return (
    <group rotation={[0, Math.PI / 4, 0]} position={[0, bob, 0]}>
      <mesh position={[0, h * 0.32, 0]} castShadow>
        <capsuleGeometry args={[w * 0.3, h * 0.3, 6, 16]} />
        <M c={body} />
      </mesh>
      <Ball r={w * 0.38} y={hy} c={P.skin} />
      {[-1, 1].map((s) => <Ball key={s} r={0.035} x={s * 0.09} y={hy + 0.04} z={w * 0.35} c={P.dark} />)}
      {mood === "angry" && [-1, 1].map((s) => <RB key={"b" + s} w={0.1} h={0.025} d={0.02} x={s * 0.09} y={hy + 0.12} z={w * 0.35} rot={[0, 0, s * -0.4]} c={P.dark} r={0.01} />)}
      {mood === "confused" && <Tor r={0.06} tube={0.018} x={0.12} y={hy + w * 0.5} arc={Math.PI * 1.4} c={P.white} />}
      {mood === "waiting" && <group position={[w * 0.35, hy + w * 0.45, 0]} rotation={[0, 0, t * 2]}><RB w={0.04} h={0.14} d={0.02} y={0.05} c={P.white} r={0.01} /></group>}
      {mouth}
    </group>
  );
};
const People: React.FC<S> = ({ w, d, h, t, mood, n = 6 }) => {
  const k = Math.max(1, Math.round(n));
  const cols = Math.ceil(Math.sqrt(k * (w / d)));
  const rows = Math.ceil(k / cols);
  const cs = [P.primary, P.accent, P.accent2, P.ok, P.coin, P.btn];
  return (
    <group>
      {new Array(k).fill(0).map((_, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        return (
          <group key={i} position={[-w / 2 + (w / cols) * (c + 0.5), 0, -d / 2 + (d / rows) * (r + 0.5)]}>
            <Person w={0.55} d={0.55} h={h} t={t + i * 0.7} mood={mood} c={cs[i % cs.length]} />
          </group>
        );
      })}
    </group>
  );
};
const Line: React.FC<S> = ({ w, h, t, n = 5 }) => (
  <group>
    {new Array(Math.max(1, Math.round(n))).fill(0).map((_, i) => (
      <group key={i} position={[-w / 2 + 0.35 + (i * (w - 0.7)) / Math.max(1, n - 1), 0, 0]}>
        <Person w={0.55} d={0.55} h={h} t={t} mood={i === 0 ? "neutral" : "waiting"} c={[P.primary, P.accent, P.accent2, P.ok, P.coin][i % 5]} />
      </group>
    ))}
  </group>
);

// ---------------- AI & data ----------------
const Brain: React.FC<S> = ({ w, t }) => (
  <group position={[0, w * 0.5, 0]}>
    {[[-0.15, 0.05, 0], [0.15, 0.05, 0], [-0.12, -0.08, 0.12], [0.12, -0.08, 0.12], [0, 0.12, -0.1]].map(([x, y, z], i) => <Ball key={i} r={w * 0.28} x={x * w} y={y * w} z={z * w} c="#F2B8C6" />)}
    <Ball r={w * 0.1} y={w * 0.32} c={P.led} e={P.led} ei={0.5 + 0.4 * Math.sin(t * 4)} />
  </group>
);
const Neural: React.FC<S> = ({ w, h, t }) => {
  const layers = [3, 4, 4, 2];
  const pts: [number, number][] = [];
  layers.forEach((n, L) => { for (let i = 0; i < n; i++) pts.push([-w / 2 + (L * w) / (layers.length - 1), h * 0.2 + ((i + 0.5) * h * 0.7) / n]); });
  return (
    <Diag>
      {pts.map(([x, y], i) => <Ball key={i} r={0.12} x={x} y={y} c={P.accent2} e={P.led} ei={0.2 + 0.5 * ((Math.sin(t * 5 - x * 2) + 1) / 2)} />)}
      {layers.slice(0, -1).map((n, L) => { const a = layers.slice(0, L).reduce((s, v) => s + v, 0); const b = a + n; return pts.slice(a, b).map((p, i) => pts.slice(b, b + layers[L + 1]).map((q, j) => { const dx = q[0] - p[0], dy = q[1] - p[1]; const len = Math.hypot(dx, dy); return <mesh key={`${L}${i}${j}`} position={[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0]} rotation={[0, 0, Math.atan2(dy, dx)]}><boxGeometry args={[len, 0.02, 0.02]} /><M c={P.white} /></mesh>; })); })}
    </Diag>
  );
};
const Magnifier: React.FC<S> = ({ w }) => (
  <group position={[0, w * 0.6, 0]} rotation={[0, Math.PI / 4, -0.5]}>
    <Tor r={w * 0.3} tube={0.08} c={P.coin} />
    <mesh><cylinderGeometry args={[w * 0.28, w * 0.28, 0.02, 32]} /><meshStandardMaterial color={P.led} transparent opacity={0.35} /></mesh>
    <RB w={0.14} h={w * 0.5} d={0.14} y={-w * 0.55} c={P.wood} r={0.05} />
  </group>
);
const Funnel: React.FC<S> = ({ w, h }) => (
  <group>
    <Cyl r={0.15} h={h * 0.3} y={h * 0.15} c={P.accent2} />
    <Cyl r={0.15} r2={w * 0.5} h={h * 0.6} y={h * 0.6} c={P.accent2} />
    {[0, 1, 2, 3].map((i) => <Ball key={i} r={0.12} x={Math.cos(i * 1.6) * w * 0.25} y={h * 0.95} z={Math.sin(i * 1.6) * w * 0.25} c={[P.coin, P.alert, P.ok, P.btn][i]} />)}
  </group>
);
const Bars: React.FC<S> = ({ w, d, h, t, n = 4 }) => {
  const k = Math.max(2, Math.round(n));
  return (
    <group>
      <RB w={w} h={0.08} d={d} y={0.04} c={P.dark} r={0.03} />
      {new Array(k).fill(0).map((_, i) => { const hh = h * (0.3 + 0.7 * ((i + 1) / k)) * Math.min(1, t * 1.5 + 0.2); return <RB key={i} w={(w / k) * 0.6} h={hh} d={d * 0.5} x={-w / 2 + (w / k) * (i + 0.5)} y={0.08 + hh / 2} c={i === k - 1 ? P.ok : P.btn} r={0.05} />; })}
    </group>
  );
};
const Pie: React.FC<S> = ({ w, h }) => (
  <group>
    {[[0, 0.55, P.btn], [0.55, 0.3, P.coin], [0.85, 0.15, P.alert]].map(([a, b, c], i) => (
      <mesh key={i} position={[0, h / 2 + (i === 2 ? 0.08 : 0), 0]} castShadow>
        <cylinderGeometry args={[w / 2, w / 2, h, 40, 1, false, (a as number) * Math.PI * 2, (b as number) * Math.PI * 2]} />
        <M c={c as string} />
      </mesh>
    ))}
  </group>
);

// ---------------- city ----------------
const Building: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.tower} r={0.1} />
    {new Array(Math.max(2, Math.floor(h / 0.5))).fill(0).map((_, r) => [0, 1, 2].map((c) => (
      <group key={`${r}${c}`}>
        <RB w={0.03} h={0.25} d={d * 0.18} x={w / 2} y={0.35 + r * 0.5} z={-d / 3 + (c * d) / 3} c={P.window} e={P.coin} ei={(r + c) % 3 ? 0.05 : 0.35} r={0.01} />
        <RB w={w * 0.18} h={0.25} d={0.03} x={-w / 3 + (c * w) / 3} y={0.35 + r * 0.5} z={d / 2} c={P.window} e={P.coin} ei={(r + c + 1) % 3 ? 0.05 : 0.35} r={0.01} />
      </group>
    )))}
  </group>
);
const Pin: React.FC<S> = ({ w, t, c }) => (
  <group position={[0, Math.abs(Math.sin(t * 3)) * 0.15, 0]}>
    <Cyl r={0.02} r2={w * 0.3} h={w * 0.6} y={w * 0.35} c={c ?? P.alert} />
    <Ball r={w * 0.32} y={w * 0.8} c={c ?? P.alert} />
    <Ball r={w * 0.13} y={w * 0.8} x={w * 0.21} z={w * 0.21} c={P.white} />
  </group>
);
const Road: React.FC<S> = ({ w, d }) => (
  <group>
    <RB w={w} h={0.06} d={d} y={0.03} c="#5A6370" r={0.02} />
    {new Array(Math.max(2, Math.floor(w / 0.8))).fill(0).map((_, i) => <RB key={i} w={0.35} h={0.02} d={0.08} x={-w / 2 + 0.4 + i * 0.8} y={0.07} c={P.white} r={0.01} />)}
  </group>
);
const Sun: React.FC<S> = ({ w, t, mood }) => mood === "moon" ? (
  <group position={[0, 2.2, 0]}><Ball r={w * 0.4} c="#F3EBC8" e="#F3EBC8" ei={0.4} /><Ball r={w * 0.4} x={w * 0.22} z={w * 0.22} y={0.05} c={P.bgDeep} /></group>
) : (
  <group position={[0, 2.2, 0]} rotation={[0, 0, t * 0.5]}>
    <Ball r={w * 0.35} c={P.coin} e={P.coin} ei={0.6} />
    {new Array(8).fill(0).map((_, i) => <RB key={i} w={0.12} h={0.3} d={0.08} x={Math.cos((i * Math.PI) / 4) * w * 0.55} y={Math.sin((i * Math.PI) / 4) * w * 0.55} rot={[0, 0, (i * Math.PI) / 4 - Math.PI / 2]} c={P.coin} e={P.coin} ei={0.5} r={0.03} />)}
  </group>
);

// ---------------- objects & symbols ----------------
const Clock3: React.FC<S> = ({ w, t }) => (
  <Diag>
    <group position={[0, w * 0.55, 0]}>
      <Cyl r={w * 0.48} h={0.18} rot={[Math.PI / 2, 0, 0]} c={P.white} />
      <Tor r={w * 0.48} tube={0.06} c={P.primary} />
      <RB w={0.06} h={w * 0.3} d={0.04} y={w * 0.13} z={0.11} rot={[0, 0, -t * 0.5]} c={P.dark} r={0.02} />
      <RB w={0.05} h={w * 0.4} d={0.04} z={0.13} rot={[0, 0, -t * 4]} c={P.alert} r={0.02} />
      {new Array(12).fill(0).map((_, i) => <Ball key={i} r={0.025} x={Math.cos((i * Math.PI) / 6) * w * 0.38} y={Math.sin((i * Math.PI) / 6) * w * 0.38} z={0.1} c={P.dark} />)}
    </group>
  </Diag>
);
const Hourglass: React.FC<S> = ({ w, h, t }) => {
  const k = (t * 0.25) % 1;
  return (
    <group>
      <RB w={w} h={0.1} d={w} y={0.05} c={P.wood} r={0.04} />
      <RB w={w} h={0.1} d={w} y={h - 0.05} c={P.wood} r={0.04} />
      <Cyl r={0.05} r2={w * 0.38} h={h / 2 - 0.1} y={h * 0.75 - 0.05} c={P.led} />
      <Cyl r={w * 0.38} r2={0.05} h={h / 2 - 0.1} y={h * 0.25 + 0.05} c={P.led} />
      <Cyl r={0.05} r2={w * 0.3 * (1 - k)} h={(h / 2 - 0.2) * (1 - k)} y={h / 2 + 0.05 + ((h / 2 - 0.2) * (1 - k)) / 2} c={P.coin} />
      <Cyl r={w * 0.3 * k + 0.02} r2={0.04} h={(h / 2 - 0.2) * k + 0.02} y={0.1 + ((h / 2 - 0.2) * k) / 2} c={P.coin} />
    </group>
  );
};
const Calendar3: React.FC<S> = ({ w, h }) => (
  <Diag>
    <RB w={w} h={h} d={0.14} y={h / 2 + 0.05} c={P.white} r={0.08} />
    <RB w={w} h={h * 0.25} d={0.16} y={h * 0.88 + 0.05} c={P.alert} r={0.06} />
    {[-1, 1].map((s) => <Cyl key={s} r={0.05} h={0.25} x={s * w * 0.25} y={h + 0.1} c={P.metal} />)}
    {new Array(9).fill(0).map((_, i) => <RB key={i} w={w * 0.18} h={h * 0.12} d={0.02} x={(i % 3 - 1) * w * 0.27} y={h * (0.6 - Math.floor(i / 3) * 0.18) + 0.05} z={0.08} c={i === 4 ? P.primary : P.gate} r={0.02} />)}
  </Diag>
);
const Bulb: React.FC<S> = ({ w, t }) => (
  <group>
    <Cyl r={w * 0.18} h={0.3} y={0.15} c={P.metal} />
    <Ball r={w * 0.38} y={0.3 + w * 0.32} c="#FFF1B8" e={P.coin} ei={0.5 + 0.3 * Math.sin(t * 4)} />
  </group>
);
const Rocket: React.FC<S> = ({ w, h, t }) => (
  <group position={[0, Math.max(0, (t % 4) - 2) * 0.3, 0]}>
    <Cyl r={w * 0.25} h={h * 0.55} y={h * 0.45} c={P.white} />
    <Cyl r={0.01} r2={w * 0.25} h={h * 0.25} y={h * 0.85} c={P.alert} />
    <Ball r={w * 0.1} y={h * 0.55} x={w * 0.18} z={w * 0.18} c={P.window} />
    {[0, 1, 2].map((k) => <RB key={k} w={0.05} h={h * 0.2} d={w * 0.3} y={h * 0.25} rot={[0, (k * Math.PI * 2) / 3, 0]} x={Math.cos((k * Math.PI * 2) / 3) * w * 0.25} z={-Math.sin((k * Math.PI * 2) / 3) * w * 0.25} c={P.alert} r={0.02} />)}
    <Ball r={w * 0.18 + 0.04 * Math.sin(t * 20)} y={h * 0.1} sy={1.6} c={P.warn} e={P.warn} ei={0.9} />
  </group>
);
const Trophy: React.FC<S> = ({ w, h }) => (
  <group>
    <RB w={w * 0.6} h={0.18} d={w * 0.6} y={0.09} c={P.wood} r={0.04} />
    <Cyl r={0.08} h={h * 0.25} y={0.3} c={P.coin} />
    <Cyl r={w * 0.15} r2={w * 0.38} h={h * 0.45} y={h * 0.65} c={P.coin} e={P.coin} ei={0.2} />
    {[-1, 1].map((s) => <Tor key={s} r={0.15} tube={0.04} x={s * w * 0.38} y={h * 0.7} rot={[0, Math.PI / 4, 0]} c={P.coin} />)}
  </group>
);
const Bell: React.FC<S> = ({ w, h, t }) => (
  <group rotation={[0, 0, Math.sin(t * 10) * 0.2 * Math.max(0, Math.sin(t * 2))]} position={[0, 0.1, 0]}>
    <Cyl r={w * 0.15} r2={w * 0.45} h={h * 0.7} y={h * 0.45} c={P.coin} e={P.coin} ei={0.2} />
    <Ball r={w * 0.12} y={h * 0.85} c={P.coin} />
    <Ball r={w * 0.1} y={h * 0.08} c={P.wood} />
  </group>
);
const Key3: React.FC<S> = ({ w }) => (
  <group position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0.6]}>
    <Tor r={w * 0.2} tube={0.08} c={P.coin} />
    <RB w={w * 0.7} h={0.12} d={0.1} x={w * 0.55} c={P.coin} r={0.04} />
    {[0.6, 0.78].map((x) => <RB key={x} w={0.08} h={0.2} d={0.1} x={w * x} y={-0.12} c={P.coin} r={0.02} />)}
  </group>
);
const Lock3: React.FC<S> = ({ w, h, mood }) => (
  <group>
    <RB w={w} h={h * 0.6} d={w * 0.5} y={h * 0.3} c={P.coin} r={0.12} />
    <Tor r={w * 0.28} tube={0.08} y={h * 0.6 + (mood === "open" ? 0.25 : 0)} arc={Math.PI} c={P.metal} rot={[0, Math.PI / 4, 0]} />
    <Ball r={0.08} y={h * 0.35} x={w * 0.2} z={w * 0.2} c={P.dark} />
  </group>
);
const Shield3: React.FC<S> = ({ w, h, c }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.5); s.lineTo(0.4, 0.34); s.lineTo(0.4, 0.02); s.quadraticCurveTo(0.38, -0.32, 0, -0.5); s.quadraticCurveTo(-0.38, -0.32, -0.4, 0.02); s.lineTo(-0.4, 0.34); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 });
    geo.translate(0, 0, -0.1);
    return geo;
  }, []);
  return (
    <group position={[0, h / 2 + 0.1, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w, h, w]}>
      <mesh geometry={g} castShadow><M c={c ?? P.ok} /></mesh>
      <RB w={0.12} h={0.35} d={0.05} x={-0.06} y={-0.02} z={0.17} rot={[0, 0, 0.7]} c={P.white} r={0.02} />
      <RB w={0.12} h={0.55} d={0.05} x={0.1} y={0.04} z={0.17} rot={[0, 0, -0.6]} c={P.white} r={0.02} />
    </group>
  );
};
const Hacker: React.FC<S> = ({ w, h, t }) => (
  <group rotation={[0, Math.PI / 4, 0]}>
    <mesh position={[0, h * 0.32, 0]} castShadow><capsuleGeometry args={[w * 0.32, h * 0.3, 6, 16]} /><M c="#3A3F4B" /></mesh>
    <Ball r={w * 0.4} y={h * 0.82} c="#3A3F4B" />
    <Ball r={w * 0.3} y={h * 0.8} z={w * 0.14} sz={0.6} c="#1A1D24" />
    {[-1, 1].map((s) => <Ball key={s} r={0.04} x={s * 0.08} y={h * 0.82} z={w * 0.33} c={P.danger} e={P.danger} ei={0.6 + 0.4 * Math.sin(t * 5)} />)}
  </group>
);
const BugBot: React.FC<S> = ({ w, t }) => (
  <group position={[0, 0.25, 0]} rotation={[0, Math.PI / 4 + Math.sin(t * 3) * 0.3, 0]}>
    <Ball r={w * 0.35} sx={0.8} sz={1.2} c={P.danger} />
    <Ball r={w * 0.2} z={w * 0.45} c={P.dark} />
    <RB w={0.02} h={w * 0.8} d={0.02} z={-0.0} y={0.2} c={P.dark} r={0.01} />
    {[-1, 1].map((s) => [-0.2, 0.05, 0.3].map((z, i) => <RB key={`${s}${i}`} w={w * 0.4} h={0.04} d={0.04} x={s * w * 0.35} z={z * w} y={-0.05 + Math.sin(t * 20 + i) * 0.03} rot={[0, 0, s * 0.4]} c={P.dark} r={0.02} />))}
  </group>
);
const Siren: React.FC<S> = ({ w, h, t }) => (
  <group>
    <RB w={w} h={0.2} d={w} y={0.1} c={P.metal} r={0.05} />
    <Cyl r={w * 0.35} r2={w * 0.25} h={h * 0.6} y={0.2 + h * 0.3} c={P.danger} e={P.danger} ei={0.3 + 0.7 * ((Math.sin(t * 12) + 1) / 2)} />
    <Ball r={w * 0.25} y={0.2 + h * 0.6} c={P.danger} e={P.danger} ei={0.4} />
  </group>
);
const Gear3: React.FC<S> = ({ w, t }) => (
  <group position={[0, w * 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
    <group rotation={[0, 0, t]}>
      <Cyl r={w * 0.35} h={0.22} rot={[Math.PI / 2, 0, 0]} c={P.metal} />
      {new Array(8).fill(0).map((_, i) => <RB key={i} w={0.2} h={0.18} d={0.22} x={Math.cos((i * Math.PI) / 4) * w * 0.42} y={Math.sin((i * Math.PI) / 4) * w * 0.42} rot={[0, 0, (i * Math.PI) / 4]} c={P.metal} r={0.04} />)}
      <Cyl r={w * 0.12} h={0.26} rot={[Math.PI / 2, 0, 0]} c={P.serverDark} />
    </group>
  </group>
);
const Puzzle: React.FC<S> = ({ w, h }) => (
  <group>
    {[[0, 0, P.btn], [1, 0, P.coin], [0, 1, P.alert], [1, 1, P.ok]].map(([x, z, c], i) => (
      <group key={i} position={[((x as number) - 0.5) * w * 0.5, 0, ((z as number) - 0.5) * w * 0.5]}>
        <RB w={w * 0.48} h={h} d={w * 0.48} y={h / 2} c={c as string} r={0.06} />
        <Cyl r={w * 0.08} h={h} x={w * 0.25} y={h / 2} c={c as string} />
      </group>
    ))}
  </group>
);
const Sign: React.FC<S> = ({ w, h, c }) => (
  <Diag>
    {[-1, 1].map((s) => <RB key={s} w={0.08} h={h * 0.5} d={0.08} x={s * w * 0.35} y={h * 0.25} c={P.wood} r={0.03} />)}
    <RB w={w} h={h * 0.55} d={0.1} y={h * 0.7} c={c ?? P.primary} r={0.06} />
  </Diag>
);
const Flag: React.FC<S> = ({ w, h, t, c }) => (
  <group>
    <Cyl r={0.04} h={h} y={h / 2} c={P.metal} />
    <group position={[0, h - 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
      <RB w={w * 0.7} h={0.45} d={0.04} x={w * 0.35} rot={[0, Math.sin(t * 4) * 0.15, 0]} c={c ?? P.alert} r={0.02} />
    </group>
  </group>
);
const Scale: React.FC<S> = ({ w, h, t, n = 0 }) => {
  const tilt = n !== 0 ? Math.sign(n) * 0.25 : Math.sin(t * 1.5) * 0.15;
  return (
    <group>
      <RB w={w * 0.4} h={0.12} d={w * 0.4} y={0.06} c={P.wood} r={0.04} />
      <Cyl r={0.06} h={h * 0.7} y={h * 0.35} c={P.coin} />
      <group position={[0, h * 0.75, 0]} rotation={[0, Math.PI / 4, tilt]}>
        <RB w={w} h={0.06} d={0.08} c={P.coin} r={0.03} />
        {[-1, 1].map((s) => <group key={s} position={[s * w * 0.45, -0.35, 0]} rotation={[0, 0, -tilt]}><Cyl r={w * 0.18} r2={w * 0.12} h={0.08} c={P.coin} /></group>)}
      </group>
    </group>
  );
};
const Magnet: React.FC<S> = ({ w, h }) => (
  <group position={[0, h * 0.5, 0]} rotation={[0, Math.PI / 4, Math.PI]}>
    <Tor r={w * 0.3} tube={w * 0.12} arc={Math.PI} c={P.danger} />
    {[-1, 1].map((s) => <RB key={s} w={w * 0.25} h={w * 0.2} d={w * 0.25} x={s * w * 0.3} y={-w * 0.08} c={P.metal} r={0.03} />)}
  </group>
);
const Chain: React.FC<S> = ({ w, n = 5, mood }) => (
  <group position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
    {new Array(Math.max(2, Math.round(n))).fill(0).map((_, i) => <Tor key={i} r={w / (n * 1.4)} tube={0.05} x={-w / 2 + (i * w) / (n - 1)} rot={[i % 2 ? Math.PI / 2 : 0, 0, 0]} c={mood === "broken" && i === Math.floor(n / 2) ? P.danger : P.metal} />)}
  </group>
);
const Bridge: React.FC<S> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={0.12} d={d} y={h} c={P.wood} r={0.03} />
    {[-1, 1].map((s) => <RB key={s} w={0.12} h={h} d={0.12} x={s * w * 0.45} y={h / 2} c={P.metal} r={0.03} />)}
    <Tor r={w * 0.5} tube={0.04} y={h} arc={Math.PI} c={P.metal} />
  </group>
);
const Envelope: React.FC<S> = ({ w, h, c }) => (
  <Diag>
    <RB w={w} h={h} d={0.1} y={h / 2 + 0.1} c={c ?? P.paper} r={0.04} />
    {[-1, 1].map((s) => <RB key={s} w={w * 0.62} h={0.05} d={0.02} x={s * w * 0.22} y={h * 0.65 + 0.1} z={0.06} rot={[0, 0, s * -0.6]} c={P.server} r={0.01} />)}
  </Diag>
);
const ChatBubble: React.FC<S> = ({ w, h, t }) => (
  <Diag>
    <RB w={w} h={h * 0.75} d={0.18} y={h * 0.55} c={P.white} r={0.2} />
    <RB w={0.25} h={0.25} d={0.16} x={-w * 0.3} y={h * 0.15} rot={[0, 0, Math.PI / 4]} c={P.white} r={0.04} />
    {[0, 1, 2].map((k) => <Ball key={k} r={0.08} x={(k - 1) * 0.26} y={h * 0.55} z={0.1} c={P.primary} e={P.primary} ei={0.2 + 0.6 * ((Math.sin(t * 8 - k) + 1) / 2)} />)}
  </Diag>
);
const QR: React.FC<S> = ({ w }) => {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const on = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2) || ((r * 7 + c) * 37) % 5 < 2; if (on) cells.push(<RB key={`${r}${c}`} w={w / 8} h={w / 8} d={0.04} x={-w / 2 + w / 14 + (c * w) / 7} y={w * 0.95 - (r * w) / 7} z={0.06} c={P.dark} r={0.01} />); }
  return <Diag><RB w={w} h={w} d={0.1} y={w / 2 + 0.1} c={P.white} r={0.05} />{cells}</Diag>;
};
const Haftsin: React.FC<S> = ({ w, d, t }) => (
  <group>
    <RB w={w} h={0.06} d={d} y={0.03} c="#E9D7B5" r={0.03} />
    <Cyl r={0.28} h={0.1} y={0.11} x={-w * 0.3} c={P.ok} />
    {new Array(10).fill(0).map((_, i) => <Cyl key={i} r={0.015} h={0.3} x={-w * 0.3 + Math.cos(i) * 0.15} y={0.3} z={Math.sin(i * 1.7) * 0.15} c={P.ok} />)}
    <Ball r={0.22} x={w * 0.05} y={0.25} c={P.led} sy={0.9} />
    <Ball r={0.06} x={w * 0.05 + Math.sin(t * 2) * 0.08} y={0.25} z={0.05} c={P.warn} sx={1.6} />
    <Ball r={0.16} x={w * 0.32} y={0.18} z={-0.2} c={P.danger} />
    <Ball r={0.12} x={w * 0.3} y={0.14} z={0.25} c={P.white} sy={1.25} />
    <Cyl r={0.08} h={0.3} x={-w * 0.05} y={0.18} z={-d * 0.3} c={P.white} e={P.coin} ei={0.3} />
  </group>
);
const Watermelon: React.FC<S> = ({ w }) => (
  <group position={[0, w * 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
    <group rotation={[-0.35, 0, 0]}>
    <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}><sphereGeometry args={[w * 0.45, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#3E8E57" /></mesh>
    <mesh position={[0, 0, 0.005]}><circleGeometry args={[w * 0.43, 32]} /><M c="#EC5F6E" /></mesh>
    {new Array(7).fill(0).map((_, i) => <Ball key={i} r={0.03} x={Math.cos(i) * w * 0.25} y={Math.sin(i * 2) * w * 0.25} z={0.02} c={P.dark} sz={0.4} />)}
    </group>
  </group>
);
const Balloon: React.FC<S> = ({ w, h, t, c }) => (
  <group position={[0, Math.sin(t * 2) * 0.1, 0]}>
    <RB w={0.02} h={h * 0.5} d={0.02} y={h * 0.25} c={P.white} r={0.005} />
    <Ball r={w * 0.35} y={h * 0.5 + w * 0.4} sy={1.2} c={c ?? P.alert} />
  </group>
);
const Cake: React.FC<S> = ({ w, h, t }) => (
  <group>
    <Cyl r={w * 0.45} h={h * 0.4} y={h * 0.2} c={P.cream} />
    <Cyl r={w * 0.47} h={0.08} y={h * 0.4} c={P.alert} />
    <Cyl r={w * 0.3} h={h * 0.3} y={h * 0.58} c={P.cream} />
    {[-1, 0, 1].map((k) => <group key={k}><Cyl r={0.03} h={0.25} x={k * 0.15} y={h * 0.85} c={P.white} /><Ball r={0.04 + 0.01 * Math.sin(t * 15 + k)} x={k * 0.15} y={h * 0.85 + 0.18} sy={1.5} c={P.warn} e={P.warn} ei={0.9} /></group>)}
  </group>
);

export const MODELS2: Record<string, { C: React.FC<S>; def: [number, number, number]; fa: string; group: string; props?: string }> = {
  pad: { C: Pad, def: [1.2, 1.2, 0.12], fa: "سکوی گرد (برای گذاشتن آیکون روی آن)", group: "کمکی", props: "color" },
  spot: { C: Spot, def: [0.8, 0.8, 0.6], fa: "نقطه‌ی نامرئی (لنگر برای آیکون/مسیر)", group: "کمکی" },
  laptop: { C: Laptop, def: [1.8, 1.3, 1.2], fa: "لپ‌تاپ", group: "دستگاه‌ها" },
  monitor: { C: Monitor, def: [1.8, 0.6, 1.8], fa: "مانیتور", group: "دستگاه‌ها" },
  tablet: { C: Tablet, def: [1.6, 2.2, 0.15], fa: "تبلت", group: "دستگاه‌ها" },
  router: { C: Router, def: [1.4, 1.0, 0.9], fa: "مودم/روتر", group: "دستگاه‌ها" },
  camera: { C: Camera, def: [0.8, 0.8, 1.6], fa: "دوربین امنیتی", group: "دستگاه‌ها" },
  battery: { C: Battery, def: [0.9, 0.9, 1.5], fa: "باتری (n=سطح شارژ ۰ تا ۱)", group: "دستگاه‌ها", props: "n" },
  cloud: { C: Cloud, def: [2.0, 1.4, 1.6], fa: "ابر (کلاد)", group: "زیرساخت" },
  globe: { C: Globe, def: [1.6, 1.6, 1.8], fa: "کره‌ی زمین/اینترنت", group: "زیرساخت" },
  rack: { C: Rack, def: [1.0, 1.0, 2.6], fa: "رک سرور", group: "زیرساخت" },
  datacenter: { C: Datacenter, def: [4.0, 3.0, 2.2], fa: "دیتاسنتر", group: "زیرساخت" },
  lb: { C: LoadBalancer, def: [1.5, 1.5, 1.0], fa: "لودبالانسر (پخش‌کننده‌ی بار)", group: "زیرساخت" },
  firewall: { C: Firewall, def: [2.0, 0.5, 1.6], fa: "فایروال", group: "زیرساخت" },
  mq: { C: Queue, def: [2.6, 0.9, 0.7], fa: "صف پیام", group: "زیرساخت" },
  container: { C: Container, def: [2.0, 1.0, 1.0], fa: "کانتینر (داکر)", group: "زیرساخت" },
  antenna: { C: Antenna, def: [0.6, 0.6, 2.4], fa: "دکل مخابرات", group: "زیرساخت" },
  satellite: { C: Satellite, def: [2.0, 1.0, 1.0], fa: "ماهواره", group: "زیرساخت" },
  browser: { C: Browser, def: [2.0, 0.4, 1.6], fa: "پنجره‌ی مرورگر", group: "وب و وردپرس" },
  terminal: { C: Terminal, def: [2.0, 0.4, 1.4], fa: "ترمینال کد", group: "وب و وردپرس" },
  form: { C: Form, def: [1.4, 0.4, 1.8], fa: "فرم", group: "وب و وردپرس" },
  admin: { C: AdminPanel, def: [2.4, 0.4, 1.6], fa: "پنل ادمین وردپرس", group: "وب و وردپرس" },
  folder: { C: Folder, def: [1.4, 0.4, 1.1], fa: "پوشه", group: "وب و وردپرس" },
  bank: { C: Bank, def: [2.4, 1.8, 1.6], fa: "بانک", group: "پول و پرداخت" },
  card: { C: Card, def: [1.6, 1.0, 0.8], fa: "کارت بانکی", group: "پول و پرداخت" },
  pos: { C: Pos, def: [0.9, 1.0, 1.4], fa: "کارتخوان", group: "پول و پرداخت" },
  wallet: { C: Wallet, def: [1.3, 0.6, 0.9], fa: "کیف پول", group: "پول و پرداخت" },
  safe: { C: Safe, def: [1.4, 1.4, 1.5], fa: "گاوصندوق", group: "پول و پرداخت" },
  coins: { C: CoinStack, def: [0.9, 0.9, 1.0], fa: "سکه‌ها (n=تعداد)", group: "پول و پرداخت", props: "n" },
  piggy: { C: Piggy, def: [1.3, 1.0, 1.2], fa: "قلک", group: "پول و پرداخت" },
  receipt: { C: Receipt, def: [0.9, 0.3, 1.4], fa: "رسید", group: "پول و پرداخت" },
  gift: { C: Gift, def: [1.2, 1.2, 1.1], fa: "هدیه / کارت هدیه", group: "پول و پرداخت" },
  tag: { C: Tag, def: [1.4, 0.3, 0.8], fa: "برچسب قیمت/تخفیف", group: "پول و پرداخت" },
  store: { C: Store, def: [2.6, 2.0, 1.6], fa: "مغازه / فروشگاه", group: "فروشگاه و لجستیک" },
  trolley: { C: Cart3, def: [1.4, 1.0, 1.0], fa: "سبد خرید (n=تعداد محصول)", group: "فروشگاه و لجستیک", props: "n" },
  shelf: { C: Shelf, def: [2.0, 0.7, 1.8], fa: "قفسه", group: "فروشگاه و لجستیک" },
  box: { C: Box, def: [1.0, 1.0, 0.8], fa: "جعبه‌ی بسته", group: "فروشگاه و لجستیک" },
  pallet: { C: Pallet, def: [1.6, 1.6, 1.3], fa: "پالت بار", group: "فروشگاه و لجستیک" },
  conveyor: { C: Conveyor, def: [3.0, 0.8, 0.6], fa: "نوار نقاله", group: "فروشگاه و لجستیک" },
  forklift: { C: Forklift, def: [1.5, 0.9, 1.6], fa: "لیفتراک", group: "فروشگاه و لجستیک" },
  bike: { C: Bike, def: [1.4, 0.6, 1.3], fa: "موتور پیک", group: "فروشگاه و لجستیک" },
  drone: { C: Drone, def: [1.4, 1.4, 1.8], fa: "پهپاد تحویل", group: "فروشگاه و لجستیک" },
  mailbox: { C: Mailbox, def: [0.7, 0.9, 1.4], fa: "صندوق پست", group: "فروشگاه و لجستیک" },
  person: { C: Person, def: [0.7, 0.7, 1.4], fa: "آدمک (mood: neutral/happy/angry/sad/surprised/confused/waiting)", group: "آدم‌ها", props: "mood,color" },
  people: { C: People, def: [3.0, 2.0, 1.2], fa: "جمعیت آدمک (n=تعداد، mood)", group: "آدم‌ها", props: "n,mood" },
  line: { C: Line, def: [3.4, 0.8, 1.3], fa: "صف آدم‌ها (n=تعداد)", group: "آدم‌ها", props: "n" },
  hacker: { C: Hacker, def: [0.8, 0.8, 1.4], fa: "هکر", group: "امنیت" },
  bugbot: { C: BugBot, def: [0.9, 0.9, 0.6], fa: "باگ/حشره", group: "امنیت" },
  padlock: { C: Lock3, def: [1.0, 0.6, 1.4], fa: "قفل بزرگ (mood: open)", group: "امنیت", props: "mood" },
  shieldbig: { C: Shield3, def: [1.4, 0.5, 1.6], fa: "سپر امنیت", group: "امنیت" },
  key: { C: Key3, def: [1.2, 0.4, 0.8], fa: "کلید", group: "امنیت" },
  siren: { C: Siren, def: [0.8, 0.8, 1.0], fa: "آژیر هشدار", group: "امنیت" },
  brain: { C: Brain, def: [1.4, 1.2, 1.3], fa: "مغز", group: "هوش مصنوعی و داده" },
  neural: { C: Neural, def: [2.2, 0.3, 1.6], fa: "شبکه‌ی عصبی", group: "هوش مصنوعی و داده" },
  magnifier: { C: Magnifier, def: [1.2, 0.4, 1.4], fa: "ذره‌بین", group: "هوش مصنوعی و داده" },
  funnel: { C: Funnel, def: [1.4, 1.4, 1.5], fa: "قیف / فیلتر", group: "هوش مصنوعی و داده" },
  bars: { C: Bars, def: [2.0, 0.8, 1.6], fa: "نمودار میله‌ای (n=تعداد ستون)", group: "هوش مصنوعی و داده", props: "n" },
  pie: { C: Pie, def: [1.6, 1.6, 0.4], fa: "نمودار دایره‌ای", group: "هوش مصنوعی و داده" },
  building: { C: Building, def: [1.6, 1.6, 2.8], fa: "ساختمان اداری", group: "شهر" },
  pin: { C: Pin, def: [0.9, 0.9, 1.3], fa: "پین مکان", group: "شهر" },
  road: { C: Road, def: [4.0, 1.2, 0.1], fa: "خیابان", group: "شهر" },
  sun: { C: Sun, def: [1.2, 1.2, 2.6], fa: "خورشید (mood: moon = ماه)", group: "شهر", props: "mood" },
  wallclock: { C: Clock3, def: [1.2, 0.4, 1.3], fa: "ساعت دیواری", group: "اشیا" },
  hourglass: { C: Hourglass, def: [0.8, 0.8, 1.4], fa: "ساعت شنی", group: "اشیا" },
  calendarbig: { C: Calendar3, def: [1.3, 0.4, 1.3], fa: "تقویم", group: "اشیا" },
  bulb: { C: Bulb, def: [0.9, 0.9, 1.1], fa: "لامپ ایده", group: "اشیا" },
  rocket: { C: Rocket, def: [0.8, 0.8, 1.8], fa: "موشک (رشد/سرعت)", group: "اشیا" },
  trophy: { C: Trophy, def: [1.0, 1.0, 1.3], fa: "جام", group: "اشیا" },
  bell: { C: Bell, def: [0.9, 0.9, 1.0], fa: "زنگ / نوتیف", group: "اشیا" },
  cog: { C: Gear3, def: [1.2, 0.4, 1.3], fa: "چرخ‌دنده", group: "اشیا" },
  puzzle: { C: Puzzle, def: [1.4, 1.4, 0.35], fa: "پازل", group: "اشیا" },
  sign: { C: Sign, def: [1.6, 0.3, 1.5], fa: "تابلو", group: "اشیا" },
  flag: { C: Flag, def: [1.0, 0.3, 1.8], fa: "پرچم", group: "اشیا" },
  scale: { C: Scale, def: [1.6, 0.6, 1.4], fa: "ترازو (n=-1 چپ سنگین، 1 راست)", group: "اشیا", props: "n" },
  magnet: { C: Magnet, def: [1.0, 0.4, 1.1], fa: "آهنربا (جذب مشتری)", group: "اشیا" },
  chain: { C: Chain, def: [2.0, 0.3, 0.6], fa: "زنجیر (mood: broken)", group: "اشیا", props: "n,mood" },
  bridge: { C: Bridge, def: [2.6, 0.8, 0.8], fa: "پل", group: "اشیا" },
  envelope: { C: Envelope, def: [1.3, 0.3, 0.9], fa: "ایمیل / نامه", group: "اشیا" },
  bubble: { C: ChatBubble, def: [1.4, 0.4, 1.2], fa: "حباب چت (در حال تایپ)", group: "اشیا" },
  qr: { C: QR, def: [1.0, 0.3, 1.1], fa: "کد QR", group: "اشیا" },
  haftsin: { C: Haftsin, def: [2.2, 1.4, 0.5], fa: "سفره‌ی هفت‌سین", group: "مناسبتی" },
  watermelon: { C: Watermelon, def: [1.2, 1.2, 0.7], fa: "هندوانه (یلدا)", group: "مناسبتی" },
  balloon: { C: Balloon, def: [0.7, 0.7, 1.8], fa: "بادکنک", group: "مناسبتی" },
  cake: { C: Cake, def: [1.1, 1.1, 1.1], fa: "کیک تولد", group: "مناسبتی" },
};
