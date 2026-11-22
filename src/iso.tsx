import React from "react";

export const U = 100;
export const C30 = Math.cos(Math.PI / 6);

export type P3 = [number, number, number];
export type P2 = [number, number];

export const iso = (x: number, y: number, z = 0): P2 => [
  (x - y) * U * C30,
  (x + y) * U * 0.5 - z * U,
];

export const pts = (arr: P3[]) =>
  arr.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");

export const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  r = f(r);
  g = f(g);
  b = f(b);
  return `rgb(${r},${g},${b})`;
};

export const COLORS = {
  bg: "#1B3D45",
  bgDeep: "#102A30",
  teal: "#149CAD",
  tealLight: "#4CCAD9",
  magenta: "#CC3366",
  white: "#FFFFFF",
  soft: "#F8FAFC",
  slate: "#33373D",
  petrol: "#2A4F58",
  ground: "#16343B",
};

type BoxProps = {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  color: string;
  opacity?: number;
  stroke?: string;
};

export const Box: React.FC<BoxProps> = ({ x, y, z = 0, w, d, h, color, opacity = 1, stroke }) => {
  const top: P3[] = [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  const fx: P3[] = [
    [x + w, y, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x + w, y, z + h],
  ];
  const fy: P3[] = [
    [x, y + d, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  const s = stroke ?? shade(color, 0.35);
  return (
    <g opacity={opacity}>
      <polygon points={pts(fx)} fill={shade(color, -0.15)} stroke={s} strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points={pts(fy)} fill={shade(color, -0.3)} stroke={s} strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points={pts(top)} fill={shade(color, 0.18)} stroke={s} strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
};

// a flat quad on the top face of a box (inset), for screens / panels
export const TopQuad: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  fill: string;
  opacity?: number;
  stroke?: string;
}> = ({ x, y, z, w, d, fill, opacity = 1, stroke }) => (
  <polygon
    points={pts([
      [x, y, z],
      [x + w, y, z],
      [x + w, y + d, z],
      [x, y + d, z],
    ])}
    fill={fill}
    opacity={opacity}
    stroke={stroke}
    strokeWidth={stroke ? 2 : 0}
  />
);

// quad on the +x face (facing right-front)
export const XQuad: React.FC<{
  x: number;
  y: number;
  z: number;
  d: number;
  h: number;
  fill: string;
  opacity?: number;
}> = ({ x, y, z, d, h, fill, opacity = 1 }) => (
  <polygon
    points={pts([
      [x, y, z],
      [x, y + d, z],
      [x, y + d, z + h],
      [x, y, z + h],
    ])}
    fill={fill}
    opacity={opacity}
  />
);

// quad on the +y face (facing left-front)
export const YQuad: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
}> = ({ x, y, z, w, h, fill, opacity = 1 }) => (
  <polygon
    points={pts([
      [x, y, z],
      [x + w, y, z],
      [x + w, y, z + h],
      [x, y, z + h],
    ])}
    fill={fill}
    opacity={opacity}
  />
);

// polyline helpers for data paths (on the ground plane)
export const polyLen = (p: P2[]) => {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};

export const pointAt = (p: P2[], t: number): P2 => {
  const L = polyLen(p) * Math.max(0, Math.min(1, t));
  let acc = 0;
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc + seg >= L) {
      const k = seg === 0 ? 0 : (L - acc) / seg;
      return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
    }
    acc += seg;
  }
  return p[p.length - 1];
};
