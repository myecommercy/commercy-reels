import React from "react";
import * as THREE from "three";
import { Bolt, M, P, RB, Truck } from "./models";
import { ICONS2 } from "../kit/icons2";

// floating clay icons, ~1 unit tall, centered at origin, facing the camera (+x+z)
const Disc: React.FC<{ r: number; c: string; e?: number; t?: number; seg?: number; rotZ?: number }> = ({ r, c, e = 0.15, t = 0.14, seg = 40, rotZ = 0 }) => (
  <mesh rotation={[Math.PI / 2, rotZ, 0]} castShadow>
    <cylinderGeometry args={[r, r, t, seg]} />
    <M c={c} e={c} ei={e} />
  </mesh>
);
const Bar: React.FC<{ w: number; h: number; x?: number; y?: number; z?: number; c: string; rot?: number }> = ({ w, h, x = 0, y = 0, z = 0.08, c, rot = 0 }) => (
  <mesh position={[x, y, z]} rotation={[0, 0, rot]}>
    <boxGeometry args={[w, h, 0.03]} />
    <M c={c} />
  </mesh>
);
const Cap: React.FC<{ len: number; x?: number; y?: number; z?: number; rot?: number; c: string; r?: number }> = ({ len, x = 0, y = 0, z = 0.1, rot = 0, c, r = 0.05 }) => (
  <mesh position={[x, y, z]} rotation={[0, 0, rot]}>
    <capsuleGeometry args={[r, len, 4, 10]} />
    <M c={c} />
  </mesh>
);

const Invoice = () => (
  <group>
    <RB w={0.7} h={0.9} d={0.1} c={P.white} r={0.04} />
    <RB w={0.7} h={0.18} d={0.12} y={0.36} c={P.btn} r={0.04} />
    {[0, 1, 2].map((i) => (
      <Bar key={i} w={i === 2 ? 0.3 : 0.48} h={0.06} x={i === 2 ? -0.09 : 0} y={0.08 - i * 0.16} c="#9FB6BC" />
    ))}
  </group>
);
const Page = () => (
  <group>
    <RB w={0.8} h={1.0} d={0.1} c={P.white} r={0.05} />
    <RB w={0.8} h={0.16} d={0.12} y={0.42} c={P.btn} r={0.04} />
    <RB w={0.32} h={0.28} d={0.12} x={-0.16} y={0.1} c="#A9DDE2" r={0.03} />
    <Bar w={0.22} h={0.05} x={0.2} y={0.18} c="#9FB6BC" />
    <Bar w={0.22} h={0.05} x={0.2} y={0.05} c="#9FB6BC" />
    <Bar w={0.6} h={0.05} y={-0.18} c="#9FB6BC" />
    <Bar w={0.4} h={0.05} x={-0.1} y={-0.3} c="#9FB6BC" />
  </group>
);
const Shield = () => {
  const g = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.5);
    s.lineTo(0.4, 0.34);
    s.lineTo(0.4, 0.02);
    s.quadraticCurveTo(0.38, -0.32, 0, -0.5);
    s.quadraticCurveTo(-0.38, -0.32, -0.4, 0.02);
    s.lineTo(-0.4, 0.34);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
    geo.translate(0, 0, -0.06);
    return geo;
  }, []);
  return (
    <group>
      <mesh geometry={g} castShadow>
        <M c={P.btn} e={P.btn} ei={0.2} />
      </mesh>
      <Cap len={0.12} x={-0.07} y={-0.02} z={0.13} rot={Math.PI / 4} c={P.white} r={0.045} />
      <Cap len={0.24} x={0.07} y={0.04} z={0.13} rot={-Math.PI / 5} c={P.white} r={0.045} />
    </group>
  );
};
const Check = () => (
  <group>
    <mesh castShadow>
      <sphereGeometry args={[0.32, 24, 18]} />
      <M c={P.led} e={P.led} ei={0.3} />
    </mesh>
    <Cap len={0.1} x={-0.07} y={-0.02} z={0.3} rot={Math.PI / 4} c={P.dark} r={0.04} />
    <Cap len={0.24} x={0.06} y={0.04} z={0.3} rot={-Math.PI / 5} c={P.dark} r={0.04} />
  </group>
);
const Cross = () => (
  <group>
    <mesh castShadow>
      <sphereGeometry args={[0.34, 24, 18]} />
      <M c={P.alert} e={P.alert} ei={0.35} />
    </mesh>
    <Cap len={0.3} z={0.32} rot={Math.PI / 4} c={P.white} r={0.045} />
    <Cap len={0.3} z={0.32} rot={-Math.PI / 4} c={P.white} r={0.045} />
  </group>
);
const Coin = () => (
  <group>
    <Disc r={0.34} c={P.coin} />
    <Disc r={0.24} c="#E9BC4C" t={0.16} e={0.1} />
  </group>
);
const Stop = () => (
  <group>
    <Disc r={0.46} c={P.alert} seg={8} rotZ={Math.PI / 8} e={0.25} />
    <RB w={0.5} h={0.14} d={0.06} z={0.08} c={P.white} r={0.03} />
  </group>
);
const Warning = () => {
  const g = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.48);
    s.lineTo(0.5, -0.38);
    s.lineTo(-0.5, -0.38);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 3 });
    geo.translate(0, 0, -0.06);
    return geo;
  }, []);
  return (
    <group>
      <mesh geometry={g} castShadow>
        <M c={P.alert} e={P.alert} ei={0.3} />
      </mesh>
      <Cap len={0.18} y={0.05} z={0.12} c={P.white} r={0.045} />
      <mesh position={[0, -0.2, 0.12]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <M c={P.white} />
      </mesh>
    </group>
  );
};
const Lock = () => (
  <group>
    <RB w={0.62} h={0.5} d={0.2} y={-0.12} c={P.coin} r={0.08} />
    <mesh position={[0, 0.16, 0]}>
      <torusGeometry args={[0.2, 0.06, 12, 24, Math.PI]} />
      <M c="#C9CFDB" />
    </mesh>
    <mesh position={[0, -0.12, 0.11]}>
      <sphereGeometry args={[0.06, 12, 10]} />
      <M c={P.dark} />
    </mesh>
  </group>
);
const Order = () => (
  <group>
    <RB w={1.0} h={0.56} d={0.1} c={P.white} r={0.12} />
    <mesh position={[-0.26, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.04, 24]} />
      <M c={P.btn} />
    </mesh>
    <Bar w={0.4} h={0.07} x={0.15} y={0.08} c="#5F7F86" />
    <Bar w={0.26} h={0.07} x={0.08} y={-0.08} c="#A9BEC3" />
  </group>
);
const Box = () => (
  <group>
    <RB w={0.7} h={0.6} d={0.7} c="#D9B98C" r={0.06} />
    <RB w={0.72} h={0.08} d={0.16} y={0.02} c="#C49C68" r={0.02} />
  </group>
);
const Gear = () => (
  <group>
    <Disc r={0.3} c="#C9CFDB" e={0.05} />
    {new Array(8).fill(0).map((_, i) => (
      <RB key={i} w={0.16} h={0.16} d={0.14} x={Math.cos((i * Math.PI) / 4) * 0.36} y={Math.sin((i * Math.PI) / 4) * 0.36} c="#C9CFDB" r={0.03} />
    ))}
    <Disc r={0.11} c={P.dark} t={0.16} e={0} />
  </group>
);
const Chat = () => (
  <group>
    <RB w={0.9} h={0.6} d={0.12} c={P.btn} r={0.2} />
    <mesh position={[0.22, -0.34, 0]} rotation={[0, 0, Math.PI / 6]}>
      <coneGeometry args={[0.1, 0.2, 3]} />
      <M c={P.btn} />
    </mesh>
    {[-0.22, 0, 0.22].map((x) => (
      <mesh key={x} position={[x, 0, 0.08]}>
        <sphereGeometry args={[0.06, 12, 10]} />
        <M c={P.white} />
      </mesh>
    ))}
  </group>
);
const Clock = () => (
  <group>
    <Disc r={0.42} c={P.white} e={0.05} />
    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.42, 0.05, 10, 40]} />
      <M c={P.btn} />
    </mesh>
    <Cap len={0.2} y={0.12} z={0.09} c={P.dark} r={0.03} />
    <Cap len={0.12} x={0.08} z={0.09} rot={Math.PI / 2} c={P.dark} r={0.03} />
  </group>
);
const Calendar = () => (
  <group>
    <RB w={0.8} h={0.75} d={0.1} c={P.white} r={0.08} />
    <RB w={0.8} h={0.2} d={0.12} y={0.28} c={P.alert} r={0.05} />
    {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <Bar key={`${r}${c}`} w={0.12} h={0.1} x={-0.22 + c * 0.22} y={0.05 - r * 0.16} c="#9FB6BC" />))}
  </group>
);
const Chart = () => (
  <group>
    <RB w={0.85} h={0.7} d={0.08} c={P.white} r={0.06} />
    {[0.18, 0.32, 0.46].map((h, i) => (
      <RB key={i} w={0.16} h={h} d={0.12} x={-0.22 + i * 0.22} y={-0.25 + h / 2} c={[P.btn, P.coin, P.alert][i]} r={0.03} />
    ))}
  </group>
);
const Search = () => (
  <group>
    <mesh rotation={[0, 0, 0]}>
      <torusGeometry args={[0.28, 0.07, 12, 32]} />
      <M c="#C9CFDB" />
    </mesh>
    <Disc r={0.24} c="#BFE9F2" t={0.04} e={0.2} />
    <Cap len={0.3} x={0.3} y={-0.3} z={0} rot={Math.PI / 4} c="#9AA3B8" r={0.07} />
  </group>
);
const Wp = () => (
  <group>
    <Disc r={0.42} c="#4E8E98" e={0.1} />
    <mesh position={[0, 0, 0.09]}>
      <torusGeometry args={[0.3, 0.04, 10, 32]} />
      <M c={P.white} />
    </mesh>
    <Cap len={0.22} x={-0.08} y={0} z={0.1} rot={0.35} c={P.white} r={0.04} />
    <Cap len={0.22} x={0.08} y={0} z={0.1} rot={-0.35} c={P.white} r={0.04} />
  </group>
);
const Bug = () => (
  <group>
    <mesh scale={[1, 1.25, 0.8]} castShadow>
      <sphereGeometry args={[0.26, 24, 18]} />
      <M c={P.alert} e={P.alert} ei={0.3} />
    </mesh>
    <mesh position={[0, 0.36, 0]}>
      <sphereGeometry args={[0.15, 16, 12]} />
      <M c="#B85A7A" />
    </mesh>
    {[-1, 1].map((s) => [-0.12, 0.05, 0.2].map((y) => <Cap key={`${s}${y}`} len={0.18} x={s * 0.3} y={-y} z={0} rot={(s * Math.PI) / 2.4} c="#7D3B52" r={0.025} />))}
  </group>
);
const Cart: React.FC<{ empty?: boolean }> = ({ empty }) => (
  <group>
    <RB w={0.8} h={0.45} d={0.5} y={0.05} c={P.btn} r={0.06} />
    {!empty && (
      <>
        <RB w={0.25} h={0.25} d={0.25} x={-0.15} y={0.38} c={P.coin} r={0.04} />
        <RB w={0.25} h={0.3} d={0.25} x={0.15} y={0.4} c={P.alert} r={0.04} />
      </>
    )}
    {[-0.25, 0.25].map((x) => (
      <mesh key={x} position={[x, -0.28, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <M c="#33373D" />
      </mesh>
    ))}
    {empty && (
      <group position={[0, 0.55, 0.3]} scale={0.6}>
        <Cross />
      </group>
    )}
  </group>
);
const Cookie = () => (
  <group>
    <Disc r={0.42} c="#E3B57A" e={0.05} t={0.16} />
    {[
      [-0.15, 0.12],
      [0.14, 0.18],
      [0.05, -0.15],
      [-0.2, -0.12],
      [0.22, -0.05],
    ].map(([x, y], i) => (
      <mesh key={i} position={[x, y, 0.09]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <M c="#6B4430" />
      </mesh>
    ))}
  </group>
);
const Ticket = () => (
  <group>
    <RB w={0.9} h={0.5} d={0.08} c={P.coin} r={0.08} />
    <Bar w={0.5} h={0.07} x={-0.08} y={0.08} c="#9C7414" />
    <Bar w={0.3} h={0.07} x={-0.18} y={-0.08} c="#9C7414" />
    <mesh position={[0.3, 0, 0.05]}>
      <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
      <M c={P.white} />
    </mesh>
  </group>
);
const User = () => (
  <group>
    <mesh position={[0, 0.2, 0]} castShadow>
      <sphereGeometry args={[0.18, 20, 16]} />
      <M c={P.btn} />
    </mesh>
    <mesh position={[0, -0.18, 0]} scale={[1, 0.7, 0.7]} castShadow>
      <sphereGeometry args={[0.32, 24, 18]} />
      <M c={P.btn} />
    </mesh>
  </group>
);
const Star = () => {
  const g = React.useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.2 : 0.45;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
    geo.translate(0, 0, -0.06);
    return geo;
  }, []);
  return (
    <mesh geometry={g} castShadow>
      <M c={P.coin} e={P.coin} ei={0.25} />
    </mesh>
  );
};
const Eye = () => (
  <group>
    <mesh scale={[1, 0.55, 0.4]}>
      <sphereGeometry args={[0.45, 28, 20]} />
      <M c={P.white} />
    </mesh>
    <mesh position={[0, 0, 0.14]}>
      <sphereGeometry args={[0.16, 20, 16]} />
      <M c={P.btn} />
    </mesh>
    <mesh position={[0, 0, 0.26]}>
      <sphereGeometry args={[0.07, 12, 10]} />
      <M c={P.dark} />
    </mesh>
  </group>
);

export const Icon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case "invoice":
      return <Invoice />;
    case "page":
      return <Page />;
    case "shield":
      return <Shield />;
    case "check":
      return <Check />;
    case "cross":
      return <Cross />;
    case "coin":
      return <Coin />;
    case "stop":
      return <Stop />;
    case "warning":
      return <Warning />;
    case "lock":
      return <Lock />;
    case "order":
      return <Order />;
    case "box":
      return <Box />;
    case "gear":
      return <Gear />;
    case "chat":
      return <Chat />;
    case "clock":
      return <Clock />;
    case "calendar":
      return <Calendar />;
    case "chart":
      return <Chart />;
    case "search":
      return <Search />;
    case "wp":
      return <Wp />;
    case "bug":
      return <Bug />;
    case "cart":
      return <Cart />;
    case "cartEmpty":
      return <Cart empty />;
    case "cookie":
      return <Cookie />;
    case "ticket":
      return <Ticket />;
    case "user":
      return <User />;
    case "star":
      return <Star />;
    case "eye":
      return <Eye />;
    case "bolt":
      return <Bolt s={1.0} />;
    case "truck":
      return (
        <group scale={0.7} position={[0, -0.4, 0]} rotation={[0, -Math.PI / 4, 0]}>
          <Truck />
        </group>
      );
    default: {
      const X = ICONS2[name];
      return X ? <X.C /> : <Check />;
    }
  }
};
