// Extra floating icons (≈1 unit tall, built in the XY plane facing +z; the engine turns them to the camera).
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, P, RB } from "../clay/models";
import { Icon } from "../clay/icons";

const ext = (pts: [number, number][], depth = 0.14, holes: [number, number][][] = []) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  holes.forEach((h) => { const p = new THREE.Path(); h.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); s.holes.push(p); });
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 3 });
  g.translate(0, 0, -depth / 2);
  return g;
};
const Shape: React.FC<{ pts: [number, number][]; c: string; depth?: number; x?: number; y?: number; z?: number; rot?: number; s?: number; e?: number }> = ({ pts, c, depth, x = 0, y = 0, z = 0, rot = 0, s = 1, e = 0.15 }) => {
  const g = useMemo(() => ext(pts, depth), [JSON.stringify(pts), depth]);
  return <mesh geometry={g} position={[x, y, z]} rotation={[0, 0, rot]} scale={s} castShadow><M c={c} e={c} ei={e} /></mesh>;
};
const Disc: React.FC<{ r: number; c: string; x?: number; y?: number; z?: number; t?: number; seg?: number }> = ({ r, c, x = 0, y = 0, z = 0, t = 0.14, seg = 40 }) => (
  <mesh position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[r, r, t, seg]} /><M c={c} e={c} ei={0.12} /></mesh>
);
const Ring: React.FC<{ r: number; tube?: number; c: string; x?: number; y?: number; z?: number; arc?: number; rot?: number }> = ({ r, tube = 0.07, c, x = 0, y = 0, z = 0, arc = Math.PI * 2, rot = 0 }) => (
  <mesh position={[x, y, z]} rotation={[0, 0, rot]} castShadow><torusGeometry args={[r, tube, 12, 40, arc]} /><M c={c} e={c} ei={0.12} /></mesh>
);
const Bar: React.FC<{ w: number; h: number; c: string; x?: number; y?: number; z?: number; rot?: number; d?: number }> = ({ w, h, c, x = 0, y = 0, z = 0.09, rot = 0, d = 0.04 }) => <RB w={w} h={h} d={d} x={x} y={y} z={z} rot={[0, 0, rot]} c={c} r={Math.min(w, h) / 2.2} />;
const Ball: React.FC<{ r: number; c: string; x?: number; y?: number; z?: number }> = ({ r, c, x = 0, y = 0, z = 0 }) => <mesh position={[x, y, z]} castShadow><sphereGeometry args={[r, 24, 18]} /><M c={c} /></mesh>;
const circlePts = (r: number, n = 32, a0 = 0, a1 = Math.PI * 2): [number, number][] => new Array(n + 1).fill(0).map((_, i) => [Math.cos(a0 + ((a1 - a0) * i) / n) * r, Math.sin(a0 + ((a1 - a0) * i) / n) * r]);
const Badge: React.FC<{ c: string; children?: React.ReactNode }> = ({ c, children }) => <group><Disc r={0.45} c={c} />{children}</group>;
const Arrow: React.FC<{ c: string; rot?: number }> = ({ c, rot = 0 }) => <Shape c={c} rot={rot} pts={[[0, 0.48], [0.38, 0.08], [0.14, 0.08], [0.14, -0.45], [-0.14, -0.45], [-0.14, 0.08], [-0.38, 0.08]]} />;
const Heart = ({ c = P.alert }: { c?: string }) => { const pts: [number, number][] = []; for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([(16 * Math.sin(t) ** 3) / 36, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 36]); } return <Shape c={c} pts={pts} />; };
const Card = ({ c, children }: { c: string; children?: React.ReactNode }) => <group><RB w={0.8} h={0.95} d={0.1} c={c} r={0.06} />{children}</group>;

const I: Record<string, { C: React.FC; fa: string }> = {
  email: { fa: "ایمیل", C: () => <group><RB w={1} h={0.68} d={0.1} c={P.paper} r={0.05} /><Bar w={0.62} h={0.06} x={-0.21} y={0.08} rot={-0.6} c={P.server} /><Bar w={0.62} h={0.06} x={0.21} y={0.08} rot={0.6} c={P.server} /></group> },
  sms: { fa: "پیامک", C: () => <group><RB w={0.62} h={1} d={0.1} c={P.phone} r={0.08} /><RB w={0.48} h={0.26} d={0.03} y={0.18} z={0.06} c={P.ok} r={0.06} /><Bar w={0.3} h={0.05} y={0.18} z={0.09} c={P.white} /></group> },
  bell: { fa: "زنگ/اعلان", C: () => <group><Shape c={P.coin} pts={[[-0.38, -0.25], [-0.3, 0.1], [-0.15, 0.35], [0, 0.4], [0.15, 0.35], [0.3, 0.1], [0.38, -0.25]]} /><Ball r={0.09} y={-0.33} c={P.coin} /><Ball r={0.11} x={0.3} y={0.35} z={0.08} c={P.danger} /></group> },
  wifi: { fa: "وای‌فای / اینترنت", C: () => <group position={[0, -0.25, 0]}>{[0.2, 0.42, 0.64].map((r) => <Ring key={r} r={r} tube={0.06} c={P.primary} arc={Math.PI / 2} rot={Math.PI / 4} />)}<Ball r={0.08} c={P.primary} /></group> },
  wifiOff: { fa: "قطع اینترنت", C: () => <group><group position={[0, -0.25, 0]}>{[0.2, 0.42, 0.64].map((r) => <Ring key={r} r={r} tube={0.06} c={P.server} arc={Math.PI / 2} rot={Math.PI / 4} />)}</group><Bar w={1.1} h={0.09} rot={-0.8} c={P.danger} z={0.12} /></group> },
  dns: { fa: "DNS / آدرس‌دهی", C: () => <group><Disc r={0.45} c={P.roof} />{[-0.15, 0, 0.15].map((y) => <Bar key={y} w={0.75} h={0.035} y={y} c={P.white} />)}<Bar w={0.04} h={0.85} c={P.white} /></group> },
  code: { fa: "کد", C: () => <group><Shape c={P.primary} pts={[[-0.1, 0.35], [-0.45, 0], [-0.1, -0.35], [-0.02, -0.27], [-0.29, 0], [-0.02, 0.27]]} /><Shape c={P.primary} pts={[[0.1, 0.35], [0.45, 0], [0.1, -0.35], [0.02, -0.27], [0.29, 0], [0.02, 0.27]]} /></group> },
  api: { fa: "API / اتصال", C: () => <group><RB w={0.5} h={0.45} d={0.18} x={-0.22} c={P.accent2} r={0.08} /><RB w={0.32} h={0.08} d={0.08} x={0.15} y={0.1} c={P.metal} r={0.03} /><RB w={0.32} h={0.08} d={0.08} x={0.15} y={-0.1} c={P.metal} r={0.03} /></group> },
  link: { fa: "لینک", C: () => <group rotation={[0, 0, Math.PI / 4]}><Ring r={0.22} tube={0.07} x={-0.18} c={P.primary} /><Ring r={0.22} tube={0.07} x={0.18} c={P.primary} /></group> },
  download: { fa: "دانلود", C: () => <group><Arrow c={P.primary} rot={Math.PI} /><Bar w={0.8} h={0.08} y={-0.52} c={P.primary} /></group> },
  upload: { fa: "آپلود", C: () => <group><Arrow c={P.primary} /><Bar w={0.8} h={0.08} y={-0.55} c={P.primary} /></group> },
  arrowUp: { fa: "فلش بالا (رشد)", C: () => <Arrow c={P.ok} /> },
  arrowDown: { fa: "فلش پایین (افت)", C: () => <Arrow c={P.danger} rot={Math.PI} /> },
  arrowRight: { fa: "فلش راست", C: () => <Arrow c={P.coin} rot={-Math.PI / 2} /> },
  arrowLeft: { fa: "فلش چپ", C: () => <Arrow c={P.coin} rot={Math.PI / 2} /> },
  filter: { fa: "فیلتر", C: () => <Shape c={P.accent2} pts={[[-0.45, 0.4], [0.45, 0.4], [0.1, -0.05], [0.1, -0.4], [-0.1, -0.3], [-0.1, -0.05]]} /> },
  heart: { fa: "قلب / علاقه", C: () => <Heart /> },
  like: { fa: "لایک", C: () => <group><RB w={0.2} h={0.5} d={0.14} x={-0.3} y={-0.12} c={P.primary} r={0.05} /><RB w={0.45} h={0.55} d={0.14} x={0.08} y={-0.1} c={P.primary} r={0.12} /><RB w={0.16} h={0.4} d={0.14} x={0.0} y={0.28} rot={[0, 0, -0.3]} c={P.primary} r={0.07} /></group> },
  dislike: { fa: "دیسلایک", C: () => <group rotation={[0, 0, Math.PI]}><RB w={0.2} h={0.5} d={0.14} x={-0.3} y={-0.12} c={P.danger} r={0.05} /><RB w={0.45} h={0.55} d={0.14} x={0.08} y={-0.1} c={P.danger} r={0.12} /><RB w={0.16} h={0.4} d={0.14} x={0.0} y={0.28} rot={[0, 0, -0.3]} c={P.danger} r={0.07} /></group> },
  share: { fa: "اشتراک‌گذاری", C: () => <group>{[[0.28, 0.3], [-0.28, 0], [0.28, -0.3]].map(([x, y], i) => <Ball key={i} r={0.13} x={x} y={y} c={P.primary} />)}<Bar w={0.62} h={0.05} y={0.15} rot={0.5} c={P.primary} /><Bar w={0.62} h={0.05} y={-0.15} rot={-0.5} c={P.primary} /></group> },
  video: { fa: "ویدیو", C: () => <group><RB w={1} h={0.7} d={0.1} c={P.danger} r={0.15} /><Shape c={P.white} z={0.08} depth={0.04} pts={[[-0.12, 0.18], [0.2, 0], [-0.12, -0.18]]} /></group> },
  music: { fa: "موسیقی / صدا", C: () => <group><Ball r={0.13} x={-0.22} y={-0.32} c={P.accent2} /><Ball r={0.13} x={0.25} y={-0.25} c={P.accent2} /><Bar w={0.07} h={0.62} x={-0.12} y={0.02} c={P.accent2} /><Bar w={0.07} h={0.62} x={0.35} y={0.08} c={P.accent2} /><Bar w={0.5} h={0.1} x={0.12} y={0.36} rot={0.15} c={P.accent2} /></group> },
  image: { fa: "عکس", C: () => <group><RB w={1} h={0.8} d={0.1} c={P.white} r={0.06} /><Shape c={P.ok} z={0.07} depth={0.03} pts={[[-0.4, -0.3], [-0.1, 0.05], [0.1, -0.12], [0.25, 0.0], [0.4, -0.3]]} /><Ball r={0.08} x={0.22} y={0.2} z={0.07} c={P.coin} /></group> },
  file: { fa: "فایل", C: () => <group><Shape c={P.white} pts={[[-0.35, -0.48], [0.35, -0.48], [0.35, 0.25], [0.12, 0.48], [-0.35, 0.48]]} />{[0.1, -0.08, -0.26].map((y) => <Bar key={y} w={0.45} h={0.05} y={y} c={P.server} z={0.1} />)}</group> },
  folder: { fa: "پوشه", C: () => <group><RB w={0.4} h={0.15} d={0.1} x={-0.25} y={0.35} c="#E8B85C" r={0.05} /><RB w={1} h={0.7} d={0.12} y={-0.02} c="#F4C96B" r={0.07} /></group> },
  trash: { fa: "سطل زباله / حذف", C: () => <group><Shape c={P.server} pts={[[-0.32, 0.25], [0.32, 0.25], [0.25, -0.48], [-0.25, -0.48]]} /><Bar w={0.8} h={0.08} y={0.33} c={P.serverDark} /><Bar w={0.25} h={0.08} y={0.42} c={P.serverDark} /></group> },
  info: { fa: "اطلاعات (i)", C: () => <Badge c={P.primary}><Bar w={0.1} h={0.36} y={-0.08} c={P.white} /><Ball r={0.07} y={0.24} z={0.08} c={P.white} /></Badge> },
  question: { fa: "سؤال (؟)", C: () => <Badge c={P.accent2}><Ring r={0.14} tube={0.05} y={0.1} z={0.08} arc={Math.PI * 1.4} rot={-0.6} c={P.white} /><Bar w={0.08} h={0.12} y={-0.1} c={P.white} /><Ball r={0.06} y={-0.27} z={0.08} c={P.white} /></Badge> },
  plus: { fa: "به‌علاوه / افزودن", C: () => <Badge c={P.ok}><Bar w={0.5} h={0.12} c={P.white} /><Bar w={0.12} h={0.5} c={P.white} /></Badge> },
  minus: { fa: "منها / کم شدن", C: () => <Badge c={P.danger}><Bar w={0.5} h={0.12} c={P.white} /></Badge> },
  percent: { fa: "درصد / تخفیف", C: () => <Badge c={P.accent}><Ring r={0.09} tube={0.045} x={-0.15} y={0.15} z={0.08} c={P.white} /><Ring r={0.09} tube={0.045} x={0.15} y={-0.15} z={0.08} c={P.white} /><Bar w={0.6} h={0.07} rot={0.9} c={P.white} /></Badge> },
  discount: { fa: "برچسب تخفیف", C: () => <group rotation={[0, 0, 0.3]}><Shape c={P.accent} pts={[[-0.45, -0.25], [0.15, -0.25], [0.45, 0], [0.15, 0.25], [-0.45, 0.25]]} /><Ball r={0.06} x={0.18} z={0.09} c={P.white} /><Bar w={0.35} h={0.06} x={-0.18} y={0.06} c={P.white} /><Bar w={0.25} h={0.06} x={-0.23} y={-0.08} c={P.white} /></group> },
  gift: { fa: "هدیه", C: () => <group><RB w={0.8} h={0.6} d={0.3} y={-0.15} c={P.alert} r={0.06} /><RB w={0.9} h={0.18} d={0.34} y={0.2} c={P.alert} r={0.05} /><Bar w={0.14} h={0.8} c={P.coin} z={0.18} /><Ring r={0.12} tube={0.05} x={-0.12} y={0.38} rot={0.5} c={P.coin} /><Ring r={0.12} tube={0.05} x={0.12} y={0.38} rot={-0.5} c={P.coin} /></group> },
  pin: { fa: "مکان", C: () => <group><Shape c={P.danger} pts={[...circlePts(0.32, 24, -0.3, Math.PI + 0.3).map(([x, y]) => [x, y + 0.12] as [number, number]), [0, -0.48]]} /><Ball r={0.12} y={0.12} z={0.1} c={P.white} /></group> },
  key: { fa: "کلید", C: () => <group rotation={[0, 0, 0.6]}><Ring r={0.18} tube={0.07} x={-0.25} c={P.coin} /><Bar w={0.6} h={0.1} x={0.2} c={P.coin} z={0} /><Bar w={0.07} h={0.18} x={0.38} y={-0.1} c={P.coin} z={0} /><Bar w={0.07} h={0.14} x={0.24} y={-0.08} c={P.coin} z={0} /></group> },
  fingerprint: { fa: "اثر انگشت", C: () => <group>{[0.12, 0.22, 0.32, 0.42].map((r, i) => <Ring key={r} r={r} tube={0.035} c={P.primary} arc={Math.PI * (1.1 + i * 0.1)} rot={-0.1 * i} />)}</group> },
  qr: { fa: "QR کد", C: () => <group><RB w={0.9} h={0.9} d={0.08} c={P.white} r={0.05} />{[[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25]].map(([x, y], i) => <RB key={i} w={0.26} h={0.26} d={0.04} x={x} y={y} z={0.05} c={P.dark} r={0.03} />)}{[[0.15, -0.15], [0.3, -0.3], [0.3, -0.1], [0.12, -0.32]].map(([x, y], i) => <RB key={"d" + i} w={0.1} h={0.1} d={0.04} x={x} y={y} z={0.05} c={P.dark} r={0.01} />)}</group> },
  barcode: { fa: "بارکد", C: () => <group><RB w={1} h={0.6} d={0.08} c={P.white} r={0.04} />{new Array(11).fill(0).map((_, i) => <RB key={i} w={i % 3 ? 0.03 : 0.06} h={0.42} d={0.03} x={-0.38 + i * 0.076} z={0.05} c={P.dark} r={0.005} />)}</group> },
  phone: { fa: "گوشی", C: () => <group><RB w={0.55} h={1} d={0.1} c={P.phone} r={0.08} /><RB w={0.45} h={0.8} d={0.02} z={0.06} c={P.screen} r={0.03} /></group> },
  laptop: { fa: "لپ‌تاپ", C: () => <group><RB w={0.9} h={0.6} d={0.06} y={0.12} c={P.metal} r={0.04} /><RB w={0.8} h={0.5} d={0.02} y={0.12} z={0.04} c={P.screen} r={0.02} /><RB w={1.1} h={0.08} d={0.3} y={-0.24} c={P.metal} r={0.03} /></group> },
  server: { fa: "سرور", C: () => <group>{[0.3, 0, -0.3].map((y) => <group key={y}><RB w={0.9} h={0.26} d={0.2} y={y} c={P.server} r={0.05} /><Ball r={0.04} x={0.32} y={y} z={0.11} c={P.led} /></group>)}</group> },
  database: { fa: "دیتابیس", C: () => <group>{[0.25, 0, -0.25].map((y) => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.38, 0.38, 0.2, 32]} /><M c="#A7B8DE" /></mesh>)}</group> },
  cloud: { fa: "ابر", C: () => <group><Ball r={0.28} c={P.white} /><Ball r={0.22} x={-0.3} y={-0.08} c={P.white} /><Ball r={0.22} x={0.3} y={-0.08} c={P.white} /></group> },
  fire: { fa: "آتش / داغ", C: () => <group><Shape c={P.warn} e={0.6} pts={[[0, 0.5], [0.3, 0.05], [0.32, -0.25], [0, -0.48], [-0.32, -0.25], [-0.3, 0.05], [-0.12, 0.2]]} /><Shape c={P.danger} e={0.4} z={0.08} s={0.55} y={-0.12} pts={[[0, 0.5], [0.3, 0.05], [0.32, -0.25], [0, -0.48], [-0.32, -0.25], [-0.3, 0.05]]} /></group> },
  rocket: { fa: "موشک", C: () => <group rotation={[0, 0, -0.6]}><Shape c={P.white} pts={[[0, 0.5], [0.18, 0.2], [0.18, -0.25], [-0.18, -0.25], [-0.18, 0.2]]} /><Ball r={0.08} y={0.08} z={0.1} c={P.window} /><Shape c={P.alert} pts={[[0.18, -0.05], [0.35, -0.35], [0.18, -0.25]]} /><Shape c={P.alert} pts={[[-0.18, -0.05], [-0.35, -0.35], [-0.18, -0.25]]} /><Ball r={0.12} y={-0.38} c={P.warn} /></group> },
  trophy: { fa: "جام", C: () => <group><Shape c={P.coin} pts={[[-0.3, 0.45], [0.3, 0.45], [0.22, 0.05], [0.06, -0.05], [0.06, -0.25], [0.2, -0.35], [0.2, -0.45], [-0.2, -0.45], [-0.2, -0.35], [-0.06, -0.25], [-0.06, -0.05], [-0.22, 0.05]]} /><Ring r={0.13} tube={0.04} x={-0.32} y={0.25} c={P.coin} /><Ring r={0.13} tube={0.04} x={0.32} y={0.25} c={P.coin} /></group> },
  medal: { fa: "مدال", C: () => <group><Shape c={P.primary} pts={[[-0.3, 0.5], [-0.1, 0.5], [0.05, 0.05], [-0.1, 0.05]]} /><Shape c={P.accent} pts={[[0.3, 0.5], [0.1, 0.5], [-0.05, 0.05], [0.1, 0.05]]} /><Disc r={0.28} y={-0.18} c={P.coin} /></group> },
  crown: { fa: "تاج (برترین)", C: () => <Shape c={P.coin} e={0.3} pts={[[-0.45, -0.3], [0.45, -0.3], [0.45, 0.3], [0.22, 0.05], [0, 0.4], [-0.22, 0.05], [-0.45, 0.3]]} /> },
  bulb: { fa: "ایده", C: () => <group><Ball r={0.32} y={0.1} c="#FFF1B8" /><RB w={0.25} h={0.22} d={0.25} y={-0.3} c={P.metal} r={0.05} /></group> },
  hourglass: { fa: "ساعت شنی / انتظار", C: () => <group><Bar w={0.6} h={0.08} y={0.45} c={P.wood} z={0} /><Bar w={0.6} h={0.08} y={-0.45} c={P.wood} z={0} /><Shape c={P.led} pts={[[-0.25, 0.4], [0.25, 0.4], [0.03, 0], [0.25, -0.4], [-0.25, -0.4], [-0.03, 0]]} /></group> },
  timer: { fa: "تایمر", C: () => <group><Disc r={0.42} c={P.white} /><Ring r={0.42} tube={0.05} c={P.danger} arc={Math.PI * 1.3} rot={Math.PI / 2} /><Bar w={0.06} h={0.3} y={0.12} c={P.dark} z={0.1} /><RB w={0.18} h={0.1} d={0.1} y={0.52} c={P.dark} r={0.03} /></group> },
  battery: { fa: "باتری", C: () => <group><RB w={0.85} h={0.45} d={0.14} c={P.white} r={0.08} /><RB w={0.08} h={0.2} d={0.1} x={0.48} c={P.white} r={0.03} /><RB w={0.5} h={0.32} d={0.04} x={-0.12} z={0.07} c={P.ok} r={0.04} /></group> },
  batteryLow: { fa: "باتری ضعیف", C: () => <group><RB w={0.85} h={0.45} d={0.14} c={P.white} r={0.08} /><RB w={0.08} h={0.2} d={0.1} x={0.48} c={P.white} r={0.03} /><RB w={0.14} h={0.32} d={0.04} x={-0.3} z={0.07} c={P.danger} r={0.04} /></group> },
  signal: { fa: "آنتن / سیگنال", C: () => <group>{[0, 1, 2, 3].map((i) => <RB key={i} w={0.16} h={0.2 + i * 0.22} d={0.14} x={-0.33 + i * 0.22} y={-0.4 + (0.2 + i * 0.22) / 2} c={P.ok} r={0.04} />)}</group> },
  globe: { fa: "اینترنت / جهانی", C: () => <group><Disc r={0.45} c={P.roof} /><Ring r={0.45} tube={0.035} c={P.white} /><Bar w={0.04} h={0.9} c={P.white} /><Bar w={0.9} h={0.04} c={P.white} /><mesh position={[0, 0, 0.08]} scale={[0.45, 1, 1]}><torusGeometry args={[0.45, 0.035, 8, 40]} /><M c={P.white} /></mesh></group> },
  home: { fa: "خانه", C: () => <group><Shape c={P.cream} pts={[[-0.35, -0.45], [0.35, -0.45], [0.35, 0.05], [0, 0.4], [-0.35, 0.05]]} /><Shape c={P.roof} z={0.02} pts={[[-0.5, 0.0], [0, 0.48], [0.5, 0.0], [0.4, -0.05], [0, 0.33], [-0.4, -0.05]]} /><RB w={0.2} h={0.3} d={0.04} y={-0.3} z={0.09} c={P.wood} r={0.02} /></group> },
  flag: { fa: "پرچم / هدف", C: () => <group><Bar w={0.06} h={1} x={-0.3} z={0} c={P.metal} /><Shape c={P.alert} pts={[[-0.27, 0.48], [0.4, 0.3], [-0.27, 0.1]]} /></group> },
  target: { fa: "هدف", C: () => <group><Disc r={0.45} c={P.danger} /><Disc r={0.3} c={P.white} z={0.02} t={0.15} /><Disc r={0.16} c={P.danger} z={0.04} t={0.16} /></group> },
  sparkle: { fa: "درخشش / جدید", C: () => <group>{[[0, 0, 1], [0.32, 0.3, 0.45], [-0.3, -0.28, 0.4]].map(([x, y, s], i) => <Shape key={i} c={P.coin} e={0.5} x={x} y={y} s={s} pts={[[0, 0.45], [0.1, 0.1], [0.45, 0], [0.1, -0.1], [0, -0.45], [-0.1, -0.1], [-0.45, 0], [-0.1, 0.1]]} />)}</group> },
  happy: { fa: "صورتک خوشحال", C: () => <Badge c={P.coin}><Ball r={0.06} x={-0.14} y={0.1} z={0.08} c={P.dark} /><Ball r={0.06} x={0.14} y={0.1} z={0.08} c={P.dark} /><Ring r={0.18} tube={0.035} y={-0.02} z={0.08} arc={Math.PI} rot={Math.PI} c={P.dark} /></Badge> },
  sad: { fa: "صورتک ناراحت", C: () => <Badge c={P.coin}><Ball r={0.06} x={-0.14} y={0.1} z={0.08} c={P.dark} /><Ball r={0.06} x={0.14} y={0.1} z={0.08} c={P.dark} /><Ring r={0.16} tube={0.035} y={-0.28} z={0.08} arc={Math.PI} c={P.dark} /></Badge> },
  angry: { fa: "صورتک عصبانی", C: () => <Badge c={P.danger}><Ball r={0.06} x={-0.14} y={0.06} z={0.08} c={P.dark} /><Ball r={0.06} x={0.14} y={0.06} z={0.08} c={P.dark} /><Bar w={0.18} h={0.05} x={-0.14} y={0.2} rot={-0.4} c={P.dark} /><Bar w={0.18} h={0.05} x={0.14} y={0.2} rot={0.4} c={P.dark} /><Ring r={0.14} tube={0.035} y={-0.28} z={0.08} arc={Math.PI} c={P.dark} /></Badge> },
  moneyBag: { fa: "کیسه‌ی پول", C: () => <group><Ball r={0.38} y={-0.1} c={P.wood} /><Shape c={P.wood} pts={[[-0.15, 0.25], [0.15, 0.25], [0.25, 0.45], [-0.25, 0.45]]} /><Bar w={0.06} h={0.38} y={-0.1} z={0.38} c={P.coin} /><Ring r={0.1} tube={0.04} y={-0.03} z={0.38} arc={Math.PI} rot={Math.PI / 2} c={P.coin} /></group> },
  cash: { fa: "اسکناس", C: () => <group>{[0, 1, 2].map((i) => <group key={i} position={[i * 0.06 - 0.06, i * 0.06 - 0.06, -i * 0.05]}><RB w={1} h={0.5} d={0.04} c={P.ok} r={0.03} /><Disc r={0.12} c="#7BC38A" z={0.03} t={0.03} /></group>)}</group> },
  chartUp: { fa: "نمودار صعودی", C: () => <group><RB w={1} h={0.8} d={0.08} c={P.white} r={0.05} />{[0, 1, 2, 3].map((i) => <RB key={i} w={0.15} h={0.15 + i * 0.15} d={0.04} x={-0.3 + i * 0.2} y={-0.3 + (0.15 + i * 0.15) / 2} z={0.06} c={P.ok} r={0.03} />)}<Bar w={0.75} h={0.05} y={0.05} rot={0.55} z={0.1} c={P.danger} /></group> },
  chartDown: { fa: "نمودار نزولی", C: () => <group><RB w={1} h={0.8} d={0.08} c={P.white} r={0.05} />{[0, 1, 2, 3].map((i) => <RB key={i} w={0.15} h={0.6 - i * 0.15} d={0.04} x={-0.3 + i * 0.2} y={-0.3 + (0.6 - i * 0.15) / 2} z={0.06} c={P.danger} r={0.03} />)}</group> },
  robot: { fa: "ربات / بات", C: () => <group><RB w={0.7} h={0.55} d={0.3} c={P.metal} r={0.12} /><Ball r={0.08} x={-0.15} y={0.04} z={0.16} c={P.led} /><Ball r={0.08} x={0.15} y={0.04} z={0.16} c={P.led} /><Bar w={0.04} h={0.2} y={0.38} c={P.metal} z={0} /><Ball r={0.06} y={0.5} c={P.danger} /></group> },
  brain: { fa: "مغز / هوش", C: () => <group>{[[-0.15, 0.08], [0.15, 0.08], [-0.12, -0.12], [0.12, -0.12], [0, 0.22]].map(([x, y], i) => <Ball key={i} r={0.24} x={x} y={y} c="#F2B8C6" />)}</group> },
  puzzle: { fa: "پازل / یکپارچه‌سازی", C: () => <group><RB w={0.6} h={0.6} d={0.14} c={P.accent2} r={0.06} /><Disc r={0.12} x={0.3} c={P.accent2} /><Disc r={0.12} y={0.3} c={P.accent2} /></group> },
  magnet: { fa: "آهنربا / جذب", C: () => <group rotation={[0, 0, Math.PI]}><Ring r={0.28} tube={0.11} arc={Math.PI} c={P.danger} /><RB w={0.22} h={0.2} d={0.22} x={-0.28} y={-0.08} c={P.metal} r={0.03} /><RB w={0.22} h={0.2} d={0.22} x={0.28} y={-0.08} c={P.metal} r={0.03} /></group> },
  receipt: { fa: "رسید", C: () => <Card c={P.paper}>{[0.28, 0.12, -0.04].map((y) => <Bar key={y} w={0.55} h={0.05} y={y} c={P.server} />)}<Bar w={0.3} h={0.07} x={0.12} y={-0.3} c={P.dark} /></Card> },
  card: { fa: "کارت بانکی", C: () => <group><RB w={1} h={0.64} d={0.06} c={P.primary} r={0.07} /><RB w={0.18} h={0.14} d={0.03} x={-0.28} y={0.06} z={0.04} c={P.coin} r={0.02} /><Bar w={0.7} h={0.05} y={-0.18} c={P.white} /></group> },
  wallet: { fa: "کیف پول", C: () => <group><RB w={0.9} h={0.65} d={0.18} c="#B5734F" r={0.12} /><RB w={0.35} h={0.25} d={0.06} x={0.3} z={0.1} c="#9A5E3E" r={0.05} /></group> },
  store: { fa: "فروشگاه", C: () => <group><RB w={0.9} h={0.55} d={0.1} y={-0.18} c={P.cream} r={0.04} />{[0, 1, 2, 3].map((i) => <RB key={i} w={0.24} h={0.22} d={0.14} x={-0.34 + i * 0.226} y={0.2} c={i % 2 ? P.white : P.alert} r={0.05} />)}<RB w={0.22} h={0.32} d={0.04} y={-0.28} z={0.06} c={P.wood} r={0.02} /></group> },
  delivery: { fa: "ارسال / بسته", C: () => <group><RB w={0.75} h={0.6} d={0.4} c="#D9B98C" r={0.05} /><Bar w={0.1} h={0.62} c="#C9A27E" z={0.21} /><Shape c={P.ok} x={0.38} y={0.32} s={0.5} pts={[[-0.1, 0], [0.05, -0.15], [0.35, 0.2], [0.27, 0.27], [0.05, 0.0], [-0.03, 0.08]]} /></group> },
  users: { fa: "کاربران / گروه", C: () => <group>{[[-0.25, 0.85, P.accent2], [0.25, 0.85, P.ok], [0, 1, P.primary]].map(([x, s, c], i) => <group key={i} position={[x as number, 0, i === 2 ? 0.1 : 0]} scale={s as number}><Ball r={0.16} y={0.18} c={P.skin} /><Shape c={c as string} y={-0.3} pts={circlePts(0.3, 20, 0, Math.PI)} /></group>)}</group> },
  admin: { fa: "مدیر / ادمین", C: () => <group><Ball r={0.18} y={0.18} c={P.skin} /><Shape c={P.dark} y={-0.3} pts={circlePts(0.32, 20, 0, Math.PI)} /><Shape c={P.coin} e={0.4} y={0.42} s={0.35} pts={[[-0.45, -0.3], [0.45, -0.3], [0.45, 0.3], [0.22, 0.05], [0, 0.4], [-0.22, 0.05], [-0.45, 0.3]]} /></group> },
  support: { fa: "پشتیبانی", C: () => <group><Ball r={0.22} c={P.skin} /><Ring r={0.3} tube={0.05} arc={Math.PI} c={P.dark} /><RB w={0.12} h={0.2} d={0.12} x={-0.3} c={P.dark} r={0.04} /><RB w={0.12} h={0.2} d={0.12} x={0.3} c={P.dark} r={0.04} /><Bar w={0.2} h={0.04} x={-0.2} y={-0.25} rot={0.6} c={P.dark} /></group> },
  verified: { fa: "تأیید شده (تیک آبی)", C: () => <group><Shape c={P.primary} pts={new Array(24).fill(0).map((_, i) => { const a = (i / 24) * Math.PI * 2; const r = i % 2 ? 0.4 : 0.47; return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]; })} /><Bar w={0.16} h={0.06} x={-0.08} y={-0.03} rot={-0.8} c={P.white} z={0.1} /><Bar w={0.3} h={0.06} x={0.07} y={0.02} rot={0.8} c={P.white} z={0.1} /></group> },
  speed: { fa: "سرعت / کیلومترشمار", C: () => <group><Shape c={P.white} pts={[[-0.45, -0.1], ...circlePts(0.45, 24, Math.PI, 0).map(([x, y]) => [x, y - 0.1] as [number, number]).reverse(), [0.45, -0.1]]} /><Bar w={0.38} h={0.06} x={0.13} y={0.02} rot={0.7} c={P.danger} z={0.1} /><Ball r={0.06} y={-0.1} z={0.1} c={P.dark} /></group> },
  refresh: { fa: "بروزرسانی / آپدیت", C: () => <group><Ring r={0.32} tube={0.07} arc={Math.PI * 1.5} c={P.ok} /><Shape c={P.ok} x={0.32} y={0.05} pts={[[-0.15, 0], [0.15, 0], [0, -0.18]]} /></group> },
  sync: { fa: "همگام‌سازی", C: () => <group><Ring r={0.32} tube={0.06} arc={Math.PI * 0.8} rot={0.2} c={P.primary} /><Ring r={0.32} tube={0.06} arc={Math.PI * 0.8} rot={Math.PI + 0.2} c={P.primary} /></group> },
  hashtag: { fa: "هشتگ", C: () => <group><Bar w={0.1} h={0.8} x={-0.14} rot={-0.15} c={P.primary} /><Bar w={0.1} h={0.8} x={0.14} rot={-0.15} c={P.primary} /><Bar w={0.75} h={0.1} y={0.14} c={P.primary} /><Bar w={0.75} h={0.1} y={-0.14} c={P.primary} /></group> },
  at: { fa: "@ (منشن/ایمیل)", C: () => <group><Ring r={0.38} tube={0.06} arc={Math.PI * 1.7} c={P.primary} /><Ring r={0.15} tube={0.06} c={P.primary} /></group> },
  calendarCheck: { fa: "تقویم با تیک (رزرو)", C: () => <group><Icon name="calendar" /><Bar w={0.14} h={0.06} x={-0.07} y={-0.12} rot={-0.8} c={P.ok} z={0.15} /><Bar w={0.26} h={0.06} x={0.06} y={-0.08} rot={0.8} c={P.ok} z={0.15} /></group> },
};
// aliases kept short for json writers
export const ICONS2 = I;
