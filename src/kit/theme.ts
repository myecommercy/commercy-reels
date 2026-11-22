// ============================================================
//  THEMES — every colour in the kit comes from here.
//  An episode picks one with  "theme": "commercy-dark"
//  and can override single keys:  "theme": {"base":"commercy-dark","alert":"#FF4D8D"}
//  Objects/icons can use a palette NAME as colour ("accent", "coin", …) or a #hex.
// ============================================================

export type Palette = {
  // 3D world
  slab: string; tile: string; path: string; alert: string; phone: string; screen: string; btn: string;
  server: string; serverDark: string; led: string; gate: string; window: string; tower: string;
  cream: string; roof: string; pillar: string; coin: string; white: string; tree: string; trunk: string;
  dark: string; ok: string; warn: string; danger: string; primary: string; accent: string; accent2: string;
  metal: string; wood: string; paper: string; skin: string; rubber: string;
  // 2D overlays
  bg: string; bgDeep: string; teal: string; tealLight: string; magenta: string; text: string; soft: string; chipText: string; chipBg: string;
};

const commercyDark: Palette = {
  slab: "#3B6D75", tile: "#447A82", path: "#7FDCE5", alert: "#EC88A8", phone: "#EEF2F4", screen: "#2B535B",
  btn: "#5FD3DF", server: "#9AA3B8", serverDark: "#6F7890", led: "#8FF0F7", gate: "#A9DDE2", window: "#4E8E98",
  tower: "#BDB6E0", cream: "#F4E6C8", roof: "#86CDD5", pillar: "#FFF8EA", coin: "#F4D06F", white: "#FFFFFF",
  tree: "#8FD3A8", trunk: "#C9A27E", dark: "#1F4950", ok: "#9FD9A8", warn: "#F4C46F", danger: "#EC7A8E",
  primary: "#149CAD", accent: "#CC3366", accent2: "#C9B6E8", metal: "#B7C0CF", wood: "#D9B98C", paper: "#FBF7EE",
  skin: "#F2C9A6", rubber: "#33373D",
  bg: "#1B3D45", bgDeep: "#102A30", teal: "#149CAD", tealLight: "#4CCAD9", magenta: "#CC3366", text: "#FFFFFF",
  soft: "#F8FAFC", chipText: "#173A41", chipBg: "#F4FBFC",
};

export const THEMES: Record<string, Palette> = {
  "commercy-dark": commercyDark,
  "commercy-light": {
    ...commercyDark,
    slab: "#CFE7EA", tile: "#DDF0F2", path: "#149CAD", screen: "#3E6E76", dark: "#9CC5CB",
    bg: "#E9F6F8", bgDeep: "#CFE7EA", text: "#173A41", soft: "#173A41", chipBg: "#FFFFFF",
  },
  "commercy-night": {
    ...commercyDark,
    slab: "#2A2350", tile: "#332B60", path: "#B9A6FF", led: "#C7B8FF", btn: "#9F8CFF", window: "#5A4C9A",
    bg: "#1A1538", bgDeep: "#0F0C24", teal: "#7D6CF0", tealLight: "#B9A6FF",
  },
  "dastres-blue": {
    ...commercyDark,
    slab: "#2D5A8C", tile: "#3667A0", path: "#8EC5FF", led: "#A8D4FF", btn: "#5AA9FF", window: "#4A7DB8",
    bg: "#173A63", bgDeep: "#0E2643", teal: "#2F80ED", tealLight: "#6FB1FF", magenta: "#FF6B6B", alert: "#FF9C9C",
  },
  "warm-sunset": {
    ...commercyDark,
    slab: "#7A4B4B", tile: "#875454", path: "#FFD3A8", led: "#FFE2B8", btn: "#FFB37A", window: "#9A6060",
    bg: "#4A2C34", bgDeep: "#2E1A20", teal: "#E07A5F", tealLight: "#F2A98F",
  },
  "mint-fresh": {
    ...commercyDark,
    slab: "#2F6B5B", tile: "#377A68", path: "#A8F0D6", led: "#B8FFE6", btn: "#5FE0B4", window: "#4C907C",
    bg: "#1C4A3E", bgDeep: "#0F2E26", teal: "#1FB386", tealLight: "#6FDDBB",
  },
};

// live palette (mutated by applyTheme at the top of every composition render)
export const P: Palette = { ...commercyDark };

export type ThemeSpec = string | ({ base?: string } & Partial<Palette>) | undefined;

export const applyTheme = (t: ThemeSpec) => {
  const base = typeof t === "string" ? t : t?.base ?? "commercy-dark";
  const over = typeof t === "object" && t ? t : {};
  const pal = THEMES[base] ?? commercyDark;
  Object.assign(P, pal);
  for (const [k, v] of Object.entries(over)) if (k !== "base" && typeof v === "string") (P as any)[k] = v.startsWith("#") ? v : (pal as any)[v] ?? v;
};

/** palette name ("accent") or #hex → #hex ; undefined → fallback */
export const col = (c: string | undefined, fallback: string) => {
  if (!c) return fallback;
  if (c.startsWith("#")) return c;
  return (P as any)[c] ?? fallback;
};
