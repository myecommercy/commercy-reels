import React, { createContext, useContext, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { P, col } from "../kit/theme";
import { MODELS2 } from "../kit/models2";
export { P, col };

// material state shared by everything inside an object (dim / alert glow / pulse)
type MatState = { op: number; glow: number; pulse: number };
const Ctx = createContext<MatState>({ op: 1, glow: 0, pulse: 0 });
export const MatScope: React.FC<{ s: MatState; children: React.ReactNode }> = ({ s, children }) => (
  <Ctx.Provider value={s}>{children}</Ctx.Provider>
);

// optional tint for a whole object ("color" on an object that has no own colour slot)
const TintCtx = createContext<string | null>(null);
const mixCache = new Map<string, string>();
const mix = (a: string, b: string) => {
  const k = a + b;
  let v = mixCache.get(k);
  if (!v) {
    v = "#" + new THREE.Color(a).lerp(new THREE.Color(b), 0.6).getHexString();
    mixCache.set(k, v);
  }
  return v;
};

export const M: React.FC<{ c: string; e?: string; ei?: number }> = ({ c: c0, e, ei = 0 }) => {
  const s = useContext(Ctx);
  const tint = useContext(TintCtx);
  const c = tint ? mix(c0, tint) : c0;
  let emissive = e ?? "#000000";
  let intensity = ei;
  if (s.glow > 0 && s.glow * 0.32 > intensity) {
    emissive = P.alert;
    intensity = s.glow * 0.32;
  }
  if (s.pulse > 0 && s.pulse * 0.6 > intensity) {
    emissive = P.led;
    intensity = s.pulse * 0.6;
  }
  return (
    <meshStandardMaterial
      color={c}
      roughness={0.92}
      metalness={0}
      emissive={emissive}
      emissiveIntensity={intensity}
      transparent={s.op < 0.999}
      opacity={s.op}
      depthWrite={s.op > 0.6}
    />
  );
};

export const RB: React.FC<{
  w: number;
  h: number;
  d: number;
  x?: number;
  y?: number;
  z?: number;
  r?: number;
  c: string;
  e?: string;
  ei?: number;
  rot?: [number, number, number];
}> = ({ w, h, d, x = 0, y = 0, z = 0, r = 0.1, c, e, ei, rot }) => (
  <RoundedBox
    args={[w, h, d]}
    radius={Math.max(0.005, Math.min(r, h / 2 - 0.002, w / 2 - 0.002, d / 2 - 0.002))}
    smoothness={4}
    position={[x, y, z]}
    rotation={rot}
    castShadow
    receiveShadow
  >
    <M c={c} e={e} ei={ei} />
  </RoundedBox>
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
const Roof: React.FC<{ w: number; d: number; h: number; y: number; c: string }> = ({ w, d, h, y, c }) => {
  const g = useMemo(() => roofGeo(w, d, h), [w, d, h]);
  return (
    <mesh geometry={g} position={[0, y, 0]} castShadow>
      <M c={c} />
    </mesh>
  );
};

export type ObjSpec = {
  id: string;
  type: string;
  x: number;
  z: number;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  label?: string;
  from?: number;
  mood?: string;
  n?: number;
  labelFrom?: number;
  labelUntil?: number;
  rot?: number;
  scale?: number;
};

// default footprints (w, d, h)
export const DEF: Record<string, [number, number, number]> = {
  phone: [1.3, 2.2, 0.18],
  server: [1.5, 1.5, 2.6],
  db: [1.7, 1.7, 1.9],
  cache: [1.5, 1.5, 1.1],
  theme: [2.2, 1.8, 1.0],
  plugin: [1.1, 1.1, 0.8],
  plugins: [1.3, 1.3, 1.9],
  crowd: [4.6, 2.8, 0.25],
  warehouse: [2.8, 2.2, 1.6],
  center: [3.4, 2.8, 2.2],
  house: [1.8, 1.8, 1.2],
  truck: [1.6, 0.9, 1.0],
  robot: [0.9, 0.9, 1.5],
  site: [1.4, 1.4, 1.2],
  frame: [1.8, 0.35, 1.6],
  reviews: [3.4, 2.0, 0.9],
  ai: [1.9, 1.9, 1.5],
  bin: [1.3, 1.3, 0.9],
  summary: [1.5, 0.25, 2.0],
};
export const dims = (o: ObjSpec) => {
  const [w, d, h] = DEF[o.type] ?? MODELS2[o.type]?.def ?? [1.4, 1.4, 1.2];
  return { w: o.w ?? w, d: o.d ?? d, h: o.h ?? h };
};

// ---------- models (centered on x,z, sitting on y=0) ----------
const Phone: React.FC<{ w: number; d: number; h: number; t: number; tap: number }> = ({ w, d, h, tap }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.phone} r={0.08} />
    <RB w={w - 0.2} h={0.04} d={d - 0.24} y={h} c={P.screen} r={0.02} />
    <RB w={w - 0.44} h={0.04} d={0.35} y={h + 0.02} z={-d / 2 + 0.5} c="#3D6870" r={0.02} />
    <RB w={w - 0.44} h={0.04} d={0.35} y={h + 0.02} z={-d / 2 + 1.0} c="#3D6870" r={0.02} />
    <RB w={w - 0.44} h={0.09} d={0.42} y={h + 0.04 - tap * 0.03} z={d / 2 - 0.5} c={P.btn} e={P.btn} ei={0.25 + tap * 0.9} r={0.04} />
  </group>
);

const Server: React.FC<{ w: number; d: number; h: number; t: number }> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.server} r={0.16} />
    {new Array(Math.max(2, Math.floor((h - 0.4) / 0.45))).fill(0).map((_, i) => (
      <group key={i}>
        <mesh position={[w / 2 + 0.005, 0.38 + i * 0.45, 0]}>
          <boxGeometry args={[0.02, 0.24, d - 0.34]} />
          <M c={P.serverDark} />
        </mesh>
        <mesh position={[w / 2 + 0.02, 0.38 + i * 0.45, -d / 2 + 0.3]}>
          <sphereGeometry args={[0.06, 16, 12]} />
          <M c={P.led} e={P.led} ei={0.5 + 0.6 * ((Math.sin(t * 9 + i * 1.7) + 1) / 2)} />
        </mesh>
        <mesh position={[0, 0.38 + i * 0.45, d / 2 + 0.005]}>
          <boxGeometry args={[w - 0.34, 0.24, 0.02]} />
          <M c={P.serverDark} />
        </mesh>
      </group>
    ))}
  </group>
);

const Db: React.FC<{ w: number; h: number; t: number }> = ({ w, h }) => {
  const r = w / 2;
  const n = 3;
  const sh = h / n;
  return (
    <group>
      {new Array(n).fill(0).map((_, i) => (
        <group key={i}>
          <mesh position={[0, sh * i + sh / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, sh - 0.08, 40]} />
            <M c={i % 2 ? "#B9C7E6" : "#A7B8DE"} />
          </mesh>
          <mesh position={[0, sh * i + sh - 0.03, 0]}>
            <cylinderGeometry args={[r + 0.03, r + 0.03, 0.06, 40]} />
            <M c="#DCE5F7" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h + 0.02, 0]}>
        <cylinderGeometry args={[r - 0.2, r - 0.2, 0.04, 40]} />
        <M c={P.led} e={P.led} ei={0.35} />
      </mesh>
    </group>
  );
};

const Bolt: React.FC<{ s?: number; c?: string }> = ({ s = 1, c = P.coin }) => {
  const g = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0.05, 0.5);
    sh.lineTo(-0.25, -0.05);
    sh.lineTo(-0.02, -0.05);
    sh.lineTo(-0.1, -0.5);
    sh.lineTo(0.25, 0.08);
    sh.lineTo(0.02, 0.08);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
    geo.translate(0, 0, -0.06);
    return geo;
  }, []);
  return (
    <mesh geometry={g} scale={s} castShadow>
      <M c={c} e={c} ei={0.25} />
    </mesh>
  );
};

const Cache: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c="#7FD8C6" r={0.22} />
    <group position={[0, h + 0.55, 0]} rotation={[0, Math.PI / 4, 0]}>
      <Bolt s={1.2} />
    </group>
  </group>
);

const Theme: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group>
    {[0, 1, 2].map((i) => (
      <RB key={i} w={w - i * 0.3} h={h / 3 - 0.04} d={d - i * 0.3} y={(h / 3) * i + h / 6} c={["#F2C6D6", "#C9B6E8", "#A9DDE2"][i]} r={0.1} />
    ))}
  </group>
);

const Plugin: React.FC<{ w: number; d: number; h: number; c: string; y?: number }> = ({ w, d, h, c, y = 0 }) => (
  <group position={[0, y, 0]}>
    <RB w={w} h={h} d={d} y={h / 2} c={c} r={0.14} />
    <mesh position={[0, h + 0.08, 0]} castShadow>
      <cylinderGeometry args={[w * 0.18, w * 0.18, 0.18, 24]} />
      <M c={c} />
    </mesh>
    <mesh position={[w / 2 + 0.06, h / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[w * 0.15, w * 0.15, 0.14, 24]} />
      <M c={c} />
    </mesh>
  </group>
);

const Plugins: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => {
  const s = h / 3;
  return (
    <group>
      {["#F4D06F", "#EC9BB6", "#9FD9A8"].map((c, i) => (
        <group key={i} rotation={[0, i * 0.35, 0]}>
          <Plugin w={w - i * 0.1} d={d - i * 0.1} h={s - 0.14} c={c} y={s * i} />
        </group>
      ))}
    </group>
  );
};

const Crowd: React.FC<{ w: number; d: number; t: number; tap: number }> = ({ w, d, t, tap }) => {
  const cols = Math.max(2, Math.floor(w / 0.75));
  const rows = Math.max(2, Math.floor(d / 1.05));
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + 0.375 + c * (w - 0.75) / Math.max(1, cols - 1);
      const z = -d / 2 + 0.52 + r * (d - 1.04) / Math.max(1, rows - 1);
      const k = (r * cols + c) * 0.37;
      const my = tap > 0 ? tap : 0.5 + 0.5 * Math.sin(t * 2 + k);
      out.push(
        <group key={`${r}-${c}`} position={[x, 0, z]}>
          <RB w={0.55} h={0.1} d={0.9} y={0.05} c={P.phone} r={0.05} />
          <RB w={0.42} h={0.03} d={0.72} y={0.11} c={P.screen} r={0.01} />
          <RB w={0.3} h={0.05} d={0.16} y={0.13} z={0.22} c={P.btn} e={P.btn} ei={0.2 + my * 0.8} r={0.02} />
        </group>,
      );
    }
  return <group>{out}</group>;
};

const Warehouse: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.cream} r={0.1} />
    <Roof w={w + 0.1} d={d + 0.2} h={0.7} y={h} c="#E6B8A2" />
    {[-0.6, 0.6].map((dx, i) => (
      <mesh key={i} position={[w / 2 + 0.01, 0.55, dx * (d / 3)]}>
        <boxGeometry args={[0.04, 1.0, 0.6]} />
        <M c="#B9A27E" />
      </mesh>
    ))}
    <mesh position={[0, 0.55, d / 2 + 0.01]}>
      <boxGeometry args={[w * 0.5, 1.0, 0.04]} />
      <M c="#C9B08A" />
    </mesh>
  </group>
);

const Center: React.FC<{ w: number; d: number; h: number; t: number }> = ({ w, d, h, t }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.gate} r={0.2} />
    <RB w={w - 0.5} h={0.3} d={d - 0.5} y={h + 0.1} c="#C6EAEE" r={0.1} />
    {[0, 1, 2, 3].map((c) => (
      <mesh key={c} position={[w / 2 + 0.01, h * 0.55, -d / 2 + 0.55 + c * ((d - 1.1) / 3)]}>
        <boxGeometry args={[0.04, h * 0.45, 0.42]} />
        <M c={P.window} e={P.led} ei={0.12} />
      </mesh>
    ))}
    {[0, 1, 2, 3].map((c) => (
      <mesh key={"y" + c} position={[-w / 2 + 0.55 + c * ((w - 1.1) / 3), h * 0.55, d / 2 + 0.01]}>
        <boxGeometry args={[0.42, h * 0.45, 0.04]} />
        <M c={P.window} e={P.led} ei={0.08} />
      </mesh>
    ))}
    {/* conveyor */}
    <RB w={0.6} h={0.2} d={d + 1.0} x={w / 2 + 0.5} y={0.15} c="#6F7890" r={0.06} />
    {[0, 1, 2].map((i) => (
      <RB key={"bx" + i} w={0.4} h={0.32} d={0.4} x={w / 2 + 0.5} y={0.42} z={((t * 0.6 + i / 3) % 1) * (d + 0.6) - (d + 0.6) / 2} c="#D9B98C" r={0.04} />
    ))}
  </group>
);

const House: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c={P.cream} r={0.1} />
    <Roof w={w + 0.15} d={d + 0.25} h={0.75} y={h} c="#86CDD5" />
    <mesh position={[0, 0.4, d / 2 + 0.01]}>
      <boxGeometry args={[0.4, 0.7, 0.04]} />
      <M c="#C9A27E" />
    </mesh>
    <mesh position={[w / 2 + 0.01, 0.65, 0]}>
      <boxGeometry args={[0.04, 0.35, 0.45]} />
      <M c={P.window} e={P.coin} ei={0.3} />
    </mesh>
  </group>
);

export const Truck: React.FC<{ w?: number; d?: number; h?: number }> = ({ w = 1.6, d = 0.9, h = 1.0 }) => (
  <group>
    <RB w={w * 0.62} h={h * 0.75} d={d} x={-w * 0.17} y={h * 0.5} c={P.white} r={0.08} />
    <RB w={w * 0.32} h={h * 0.55} d={d * 0.95} x={w * 0.32} y={h * 0.4} c={P.btn} r={0.08} />
    <mesh position={[w * 0.48, h * 0.5, 0]}>
      <boxGeometry args={[0.02, h * 0.22, d * 0.7]} />
      <M c={P.screen} />
    </mesh>
    {[-0.3, 0.3].map((xx) =>
      [-1, 1].map((s) => (
        <mesh key={`${xx}${s}`} position={[xx * w, 0.16, (s * d) / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 20]} />
          <M c="#33373D" />
        </mesh>
      )),
    )}
  </group>
);

const Robot: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => {
  const bob = Math.sin(t * 4) * 0.04;
  return (
    <group position={[0, bob, 0]}>
      <RB w={w} h={h * 0.5} d={w} y={h * 0.25 + 0.1} c="#C9CFDB" r={0.18} />
      <RB w={w * 0.85} h={h * 0.34} d={w * 0.85} y={h * 0.7} c="#E5E9F0" r={0.16} />
      <mesh position={[w * 0.43, h * 0.72, 0]}>
        <boxGeometry args={[0.04, 0.12, w * 0.5]} />
        <M c={P.alert} e={P.alert} ei={0.9} />
      </mesh>
      <mesh position={[0, h * 0.95, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
        <M c="#9AA3B8" />
      </mesh>
      <mesh position={[0, h * 1.1, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <M c={P.alert} e={P.alert} ei={0.6 + 0.4 * Math.sin(t * 6)} />
      </mesh>
    </group>
  );
};

const Site: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group>
    <RB w={w} h={h} d={d} y={h / 2} c="#C6D3E8" r={0.14} />
    <mesh position={[w / 2 + 0.01, h * 0.55, 0]}>
      <boxGeometry args={[0.04, h * 0.6, d * 0.7]} />
      <M c={P.screen} e={P.led} ei={0.12} />
    </mesh>
    <mesh position={[0, h * 0.55, d / 2 + 0.01]}>
      <boxGeometry args={[w * 0.7, h * 0.6, 0.04]} />
      <M c={P.screen} e={P.led} ei={0.08} />
    </mesh>
  </group>
);

const Frame: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group rotation={[0, Math.PI / 4, 0]}>
    <RB w={w} h={h} d={d} y={h / 2 + 0.1} c="#E6D3AE" r={0.08} />
    <RB w={w - 0.25} h={h - 0.25} d={0.05} y={h / 2 + 0.1} z={d / 2} c="#A9DDE2" r={0.02} />
    <mesh position={[-0.2, h * 0.38, d / 2 + 0.04]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.6, 0.6, 0.03]} />
      <M c="#8FD3A8" />
    </mesh>
    <mesh position={[0.35, h * 0.72, d / 2 + 0.05]}>
      <cylinderGeometry args={[0.14, 0.14, 0.03, 20]} />
      <M c={P.coin} />
    </mesh>
  </group>
);

const Reviews: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => {
  const out: React.ReactNode[] = [];
  const cols = 5,
    rows = 3;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      out.push(
        <group key={`${r}${c}`} position={[-w / 2 + 0.35 + c * ((w - 0.7) / (cols - 1)), 0, -d / 2 + 0.35 + r * ((d - 0.7) / (rows - 1))]} rotation={[0, ((r * 7 + c * 3) % 5) * 0.1 - 0.2, 0]}>
          <RB w={0.5} h={h * (0.6 + ((r + c) % 3) * 0.15)} d={0.08} y={(h * (0.6 + ((r + c) % 3) * 0.15)) / 2} c={P.white} r={0.03} />
          <mesh position={[0, h * 0.45, 0.05]}>
            <boxGeometry args={[0.3, 0.05, 0.02]} />
            <M c={(r + c) % 4 === 0 ? P.alert : P.coin} />
          </mesh>
        </group>,
      );
    }
  return <group>{out}</group>;
};

const Ai: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => (
  <group>
    <RB w={w} h={h} d={w} y={h / 2} c="#C9B6E8" r={0.35} />
    <mesh position={[0, h + 0.35, 0]}>
      <sphereGeometry args={[0.42, 32, 24]} />
      <M c={P.led} e={P.led} ei={0.6 + 0.3 * Math.sin(t * 3)} />
    </mesh>
    <mesh position={[0, h + 0.35, 0]} rotation={[Math.PI / 2.4, t * 0.8, 0]}>
      <torusGeometry args={[0.62, 0.04, 10, 48]} />
      <M c="#FFFFFF" />
    </mesh>
  </group>
);

const Bin: React.FC<{ w: number; d: number; h: number; c: string }> = ({ w, d, h, c }) => (
  <group>
    <RB w={w} h={0.12} d={d} y={0.06} c={c} r={0.05} />
    <RB w={0.1} h={h} d={d} x={-w / 2 + 0.05} y={h / 2} c={c} r={0.04} />
    <RB w={0.1} h={h} d={d} x={w / 2 - 0.05} y={h / 2} c={c} r={0.04} />
    <RB w={w} h={h} d={0.1} z={-d / 2 + 0.05} y={h / 2} c={c} r={0.04} />
    <RB w={w} h={h * 0.6} d={0.1} z={d / 2 - 0.05} y={h * 0.3} c={c} r={0.04} />
    <RB w={w * 0.6} h={0.3} d={d * 0.5} y={0.3} c={P.white} r={0.04} />
  </group>
);

const Summary: React.FC<{ w: number; d: number; h: number }> = ({ w, d, h }) => (
  <group rotation={[0, Math.PI / 4, 0]}>
    <RB w={w} h={h} d={d} y={h / 2 + 0.1} c={P.white} r={0.06} />
    <RB w={w} h={0.3} d={d + 0.02} y={h - 0.05} c={P.btn} r={0.05} />
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[i === 4 ? -0.2 : 0, h - 0.5 - i * 0.26, d / 2 + 0.01]}>
        <boxGeometry args={[i === 4 ? w * 0.45 : w * 0.7, 0.07, 0.02]} />
        <M c="#9FB6BC" />
      </mesh>
    ))}
  </group>
);

const OWN_COLOR = new Set(["plugin", "bin", "person", "card", "gift", "tag", "container", "pin", "sign", "flag", "envelope", "balloon", "shieldbig"]);
export const Model: React.FC<{ o: ObjSpec; t: number; tap: number }> = ({ o, t, tap }) => {
  const tint = o.color && !OWN_COLOR.has(o.type) ? col(o.color, "#ffffff") : null;
  const inner = <ModelInner o={o} t={t} tap={tap} />;
  const g = o.rot || o.scale ? <group rotation={[0, ((o.rot ?? 0) * Math.PI) / 180, 0]} scale={o.scale ?? 1}>{inner}</group> : inner;
  return tint ? <TintCtx.Provider value={tint}>{g}</TintCtx.Provider> : g;
};
const ModelInner: React.FC<{ o: ObjSpec; t: number; tap: number }> = ({ o, t, tap }) => {
  const { w, d, h } = dims(o);
  const own = o.color ? col(o.color, P.gate) : undefined;
  switch (o.type) {
    case "phone":
      return <Phone w={w} d={d} h={h} t={t} tap={tap} />;
    case "server":
      return <Server w={w} d={d} h={h} t={t} />;
    case "db":
      return <Db w={w} h={h} t={t} />;
    case "cache":
      return <Cache w={w} d={d} h={h} />;
    case "theme":
      return <Theme w={w} d={d} h={h} />;
    case "plugin":
      return <Plugin w={w} d={d} h={h} c={own ?? P.coin} />;
    case "plugins":
      return <Plugins w={w} d={d} h={h} />;
    case "crowd":
      return <Crowd w={w} d={d} t={t} tap={tap} />;
    case "warehouse":
      return <Warehouse w={w} d={d} h={h} />;
    case "center":
      return <Center w={w} d={d} h={h} t={t} />;
    case "house":
      return <House w={w} d={d} h={h} />;
    case "truck":
      return <Truck w={w} d={d} h={h} />;
    case "robot":
      return <Robot w={w} h={h} t={t} />;
    case "site":
      return <Site w={w} d={d} h={h} />;
    case "frame":
      return <Frame w={w} d={d} h={h} />;
    case "reviews":
      return <Reviews w={w} d={d} h={h} />;
    case "ai":
      return <Ai w={w} h={h} t={t} />;
    case "bin":
      return <Bin w={w} d={d} h={h} c={own ?? P.gate} />;
    case "summary":
      return <Summary w={w} d={d} h={h} />;
    default: {
      const m = MODELS2[o.type];
      if (m) return <m.C w={w} d={d} h={h} t={t} mood={o.mood} n={o.n} c={own} />;
      return <RB w={w} h={h} d={d} y={h / 2} c={own ?? P.gate} r={0.15} />;
    }
  }
};

export const Tree: React.FC<{ x: number; z: number; s?: number }> = ({ x, z, s = 1 }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.25, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.09, 0.5, 12]} />
      <M c={P.trunk} />
    </mesh>
    <mesh position={[0, 0.72, 0]} castShadow>
      <sphereGeometry args={[0.34, 24, 18]} />
      <M c={P.tree} />
    </mesh>
    <mesh position={[0.16, 0.98, 0.05]} castShadow>
      <sphereGeometry args={[0.22, 24, 18]} />
      <M c={P.tree} />
    </mesh>
  </group>
);

export { Bolt };
