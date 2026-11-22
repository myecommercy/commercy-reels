// Builds "gallery-*" compositions that show every model of the kit, 9 per page, with its type name.
import type { EpisodeSpec } from "../clay/Episode";
import { DEF } from "../clay/models";
import { MODELS2 } from "./models2";

export const ALL_MODELS = [...Object.keys(DEF), ...Object.keys(MODELS2)];

export const galleryPages = (theme = "commercy-dark"): EpisodeSpec[] => {
  const pages: EpisodeSpec[] = [];
  const per = 9;
  for (let p = 0; p * per < ALL_MODELS.length; p++) {
    const types = ALL_MODELS.slice(p * per, p * per + per);
    const objects = types.map((type, i) => ({ id: `m${i}`, type, x: (i % 3) * 4.2 - 4.2, z: Math.floor(i / 3) * 4.2 - 4.2, from: 0, label: type }));
    pages.push({
      id: `gallery-${String(p + 1).padStart(2, "0")}`,
      title: "gallery",
      question: "",
      finalBig: null,
      theme,
      objects,
      lines: [{ text: `گالری کیت · صفحه‌ی ${p + 1}`, chip: `صفحه‌ی ${p + 1}`, keys: [], do: { cam: objects.map((o) => o.id), maxZoom: 0.9 } }],
    } as EpisodeSpec);
  }
  return pages;
};

import { ICONS2 } from "./icons2";
export const OLD_ICONS = ["invoice", "page", "shield", "check", "cross", "coin", "stop", "warning", "lock", "order", "box", "gear", "chat", "clock", "calendar", "chart", "search", "wp", "bug", "cart", "cartEmpty", "cookie", "ticket", "user", "star", "eye", "bolt", "truck"];
export const ALL_ICONS = [...OLD_ICONS, ...Object.keys(ICONS2)];

export const iconPages = (theme = "commercy-dark"): EpisodeSpec[] => {
  const pages: EpisodeSpec[] = [];
  const per = 12;
  for (let p = 0; p * per < ALL_ICONS.length; p++) {
    const names = ALL_ICONS.slice(p * per, p * per + per);
    const pads = names.map((n, i) => ({ id: `p${i}`, type: "pad", x: (i % 3) * 4 - 4, z: Math.floor(i / 3) * 4 - 6, from: 0 }));
    const tags = names.map((n, i) => ({ id: `t${i}`, type: "spot", x: (i % 3) * 4 - 4 + 1.0, z: Math.floor(i / 3) * 4 - 6 + 1.0, h: 0.01, from: 0, label: n }));
    const objects = [...pads, ...tags];
    pages.push({
      id: `icons-${String(p + 1).padStart(2, "0")}`,
      title: "icons",
      question: "",
      finalBig: null,
      theme,
      objects,
      lines: [{ text: `آیکون‌ها · صفحه‌ی ${p + 1}`, chip: `آیکون‌ها ${p + 1}`, keys: [], do: { cam: pads.map((o) => o.id), maxZoom: 0.9, icons: names.map((n, i) => ({ icon: n, on: `p${i}`, at: 0, dy: 0.6 })) } }],
    } as EpisodeSpec);
  }
  return pages;
};
