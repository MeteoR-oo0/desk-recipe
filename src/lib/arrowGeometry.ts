import type { ArrowAnchor } from "../types/project";
export type Box = { x: number; y: number; width: number; height: number };
const GAP = 14;
export function perimeterAnchor(
  box: Box,
  point: { x: number; y: number },
): ArrowAnchor {
  const left = box.x - GAP,
    right = box.x + box.width + GAP,
    top = box.y - GAP,
    bottom = box.y + box.height + GAP;
  const options = [
    {
      edge: "left",
      distance: Math.abs(point.x - left),
      t: (point.y - top) / (bottom - top),
    },
    {
      edge: "right",
      distance: Math.abs(point.x - right),
      t: (point.y - top) / (bottom - top),
    },
    {
      edge: "top",
      distance: Math.abs(point.y - top),
      t: (point.x - left) / (right - left),
    },
    {
      edge: "bottom",
      distance: Math.abs(point.y - bottom),
      t: (point.x - left) / (right - left),
    },
  ] as const;
  const near = [...options].sort((a, b) => a.distance - b.distance)[0];
  return { edge: near.edge, t: Math.max(0, Math.min(1, near.t)) };
}
export function anchorPoint(box: Box, anchor: ArrowAnchor) {
  const left = box.x - GAP,
    right = box.x + box.width + GAP,
    top = box.y - GAP,
    bottom = box.y + box.height + GAP;
  return anchor.edge === "left"
    ? { x: left, y: top + (bottom - top) * anchor.t }
    : anchor.edge === "right"
      ? { x: right, y: top + (bottom - top) * anchor.t }
      : anchor.edge === "top"
        ? { x: left + (right - left) * anchor.t, y: top }
        : { x: left + (right - left) * anchor.t, y: bottom };
}
export function automaticAnchor(
  box: Box,
  target: { x: number; y: number },
): ArrowAnchor {
  const cx = box.x + box.width / 2,
    cy = box.y + box.height / 2,
    dx = target.x - cx,
    dy = target.y - cy,
    rx = (box.width / 2 + GAP) / Math.max(Math.abs(dx), 0.0001),
    ry = (box.height / 2 + GAP) / Math.max(Math.abs(dy), 0.0001),
    factor = Math.min(rx, ry);
  return perimeterAnchor(box, { x: cx + dx * factor, y: cy + dy * factor });
}
export function arrowGeometry(
  box: Box,
  target: { x: number; y: number },
  type: "curve" | "line" | "polyline" | "swirl",
  manual?: ArrowAnchor,
) {
  const anchor = manual ?? automaticAnchor(box, target),
    start = anchorPoint(box, anchor),
    sx = start.x,
    sy = start.y;
  if (
    target.x >= box.x - 8 &&
    target.x <= box.x + box.width + 8 &&
    target.y >= box.y - 8 &&
    target.y <= box.y + box.height + 8
  )
    return null;
  if (type === "swirl") {
    const dx = target.x - sx,
      dy = target.y - sy,
      distance = Math.hypot(dx, dy),
      ux = dx / distance,
      uy = dy / distance,
      nx = -uy,
      ny = ux,
      r = Math.min(48, Math.max(14, distance * 0.14)),
      mx = sx + dx * 0.52,
      my = sy + dy * 0.52,
      points = [sx, sy, mx - ux * r * 0.7, my - uy * r * 0.7];
    for (let step = 0; step <= 16; step++) {
      const angle = (step / 16) * Math.PI * 2;
      points.push(
        mx + ux * r * Math.sin(angle) + nx * r * (1 - Math.cos(angle)),
        my + uy * r * Math.sin(angle) + ny * r * (1 - Math.cos(angle)),
      );
    }
    points.push(mx + ux * r * 0.7, my + uy * r * 0.7, target.x, target.y);
    return { points, tension: 0.3 };
  }
  if (type === "line")
    return { points: [sx, sy, target.x, target.y], tension: 0 };
  const horizontal = anchor.edge === "left" || anchor.edge === "right",
    sign = anchor.edge === "left" || anchor.edge === "top" ? -1 : 1,
    distance = Math.hypot(target.x - sx, target.y - sy),
    lead = Math.min(55, distance * 0.3),
    lx = sx + (horizontal ? sign * lead : 0),
    ly = sy + (horizontal ? 0 : sign * lead);
  return type === "polyline"
    ? {
        points: horizontal
          ? [sx, sy, lx, sy, lx, target.y, target.x, target.y]
          : [sx, sy, sx, ly, target.x, ly, target.x, target.y],
        tension: 0,
      }
    : {
        points: [
          sx,
          sy,
          lx,
          ly,
          (lx + target.x) / 2 + (horizontal ? 0 : Math.min(25, distance * 0.1)),
          (ly + target.y) / 2 + (horizontal ? Math.min(25, distance * 0.1) : 0),
          target.x,
          target.y,
        ],
        tension: 0.35,
      };
}
