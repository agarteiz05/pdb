import { Achievement } from "./supabase";

export type LayoutNode = {
  achievement: Achievement;
  top: number;
  left: number;
  width: number;
};

export type Layout = {
  nodes: LayoutNode[];
  pathD: string;
  aspectRatio: string;
};

const VIEWBOX_W_MOBILE = 430;
const SLOT_H_MOBILE = 210;
const PAD_TOP_MOBILE = 40;
const PAD_BOTTOM_MOBILE = 60;

const VIEWBOX_H_DESKTOP = 760;
const SLOT_W_DESKTOP = 230;
const PAD_LEFT_DESKTOP = 40;
const PAD_RIGHT_DESKTOP = 60;

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${midY} ${midX} ${midY} Q ${curr.x} ${midY} ${curr.x} ${curr.y}`;
  }
  return d;
}

// Bandas bien separadas para que la ruta se abra de verdad de un lado al otro.
const X_BANDS = [2, 62, 22, 78, 10, 50];

export function computeMobileLayout(achievements: Achievement[]): Layout {
  const n = achievements.length;
  const totalHeight = n > 0 ? (n - 1) * SLOT_H_MOBILE + PAD_TOP_MOBILE + PAD_BOTTOM_MOBILE : 1;

  const points = achievements.map((_, i) => {
    const y = PAD_TOP_MOBILE + i * SLOT_H_MOBILE;
    const xBandPct = X_BANDS[i % X_BANDS.length];
    const x = (xBandPct / 100) * VIEWBOX_W_MOBILE + VIEWBOX_W_MOBILE * 0.12;
    return { x, y };
  });

  const nodes: LayoutNode[] = achievements.map((achievement, i) => {
    const isEvento = achievement.stop_type === "evento";
    const width = isEvento ? 16 : 22;
    const leftPx = points[i].x - (width / 100) * VIEWBOX_W_MOBILE * 0.5;
    return {
      achievement,
      top: (points[i].y / totalHeight) * 100,
      left: Math.max(2, Math.min(98 - width, (leftPx / VIEWBOX_W_MOBILE) * 100)),
      width,
    };
  });

  return {
    nodes,
    pathD: buildPath(points),
    aspectRatio: `${VIEWBOX_W_MOBILE} / ${totalHeight}`,
  };
}

// Bandas verticales bien separadas para desktop: la parada 0 siempre arranca arriba.
const Y_BANDS = [4, 58, 18, 72, 30, 46];

export function computeDesktopLayout(achievements: Achievement[]): Layout {
  const n = achievements.length;
  const totalWidth = n > 0 ? (n - 1) * SLOT_W_DESKTOP + PAD_LEFT_DESKTOP + PAD_RIGHT_DESKTOP : 1;

  const points = achievements.map((_, i) => {
    const x = PAD_LEFT_DESKTOP + i * SLOT_W_DESKTOP;
    const yBandPct = Y_BANDS[i % Y_BANDS.length];
    const y = (yBandPct / 100) * VIEWBOX_H_DESKTOP + VIEWBOX_H_DESKTOP * 0.03;
    return { x, y };
  });

  const nodes: LayoutNode[] = achievements.map((achievement, i) => {
    const isEvento = achievement.stop_type === "evento";
    const width = isEvento ? 6 : 8.5;
    const leftPx = points[i].x - (width / 100) * totalWidth * 0.5;
    return {
      achievement,
      top: (points[i].y / VIEWBOX_H_DESKTOP) * 100,
      left: (leftPx / totalWidth) * 100,
      width,
    };
  });

  return {
    nodes,
    pathD: buildPath(points),
    aspectRatio: `${totalWidth} / ${VIEWBOX_H_DESKTOP}`,
  };
}

export function viewBoxFor(aspectRatio: string): string {
  const [w, h] = aspectRatio.split(" / ").map(Number);
  return `0 0 ${w} ${h}`;
}
