import { avoidCircle } from "./connectorRouting.ts";
import type { ArrowAnchor } from "../types/project";
import { anchorPoint, automaticAnchor, type Box } from "./arrowGeometry.ts";
export type Point = { x: number; y: number };
export type Cubic = { c1: Point; c2: Point; end: Point };
export function loopGeometry(
  box: Box,
  target: Point,
  manualAnchor?: ArrowAnchor,
  manualCenter?: Point,
  manualRadius?: number,
  obstacles: Box[] = [],
) {
  const anchor = manualAnchor ?? automaticAnchor(box, target),
    start = anchorPoint(box, anchor),
    dx = target.x - start.x,
    dy = target.y - start.y,
    distance = Math.max(.000001, Math.hypot(dx, dy)),
    u = distance<.0001 ? (anchor.edge==='left'?{x:-1,y:0}:anchor.edge==='right'?{x:1,y:0}:anchor.edge==='top'?{x:0,y:-1}:{x:0,y:1}) : {x:dx/distance,y:dy/distance},
    n = { x: -u.y, y: u.x },
    radius = manualRadius ?? Math.min(55, Math.max(20, distance * 0.16));
  const intendedCenter = manualCenter ?? {
    x: start.x + dx * 0.52 + n.x * radius,
    y: start.y + dy * 0.52 + n.y * radius,
  };
  const center = avoidCircle(intendedCenter, radius, obstacles);
  const point = (angle: number) => ({
      x:
        center.x +
        u.x * radius * Math.sin(angle) -
        n.x * radius * Math.cos(angle),
      y:
        center.y +
        u.y * radius * Math.sin(angle) -
        n.y * radius * Math.cos(angle),
    }),
    tangent = (angle: number) => ({
      x: u.x * Math.cos(angle) + n.x * Math.sin(angle),
      y: u.y * Math.cos(angle) + n.y * Math.sin(angle),
    }),
    entry = point(0),
    outward =
      anchor.edge === "left"
        ? { x: -1, y: 0 }
        : anchor.edge === "right"
          ? { x: 1, y: 0 }
          : anchor.edge === "top"
            ? { x: 0, y: -1 }
            : { x: 0, y: 1 },
    lead = Math.min(
      160,
      Math.max(35, Math.hypot(entry.x - start.x, entry.y - start.y) * 0.45),
    );
  const segments: Cubic[] = [
    {
      c1: { x: start.x + outward.x * lead, y: start.y + outward.y * lead },
      c2: { x: entry.x - u.x * lead * 0.7, y: entry.y - u.y * lead * 0.7 },
      end: entry,
    },
  ];
  const k = 0.5522847498;
  for (let q = 0; q < 4; q++) {
    const a = (q * Math.PI) / 2,
      b = ((q + 1) * Math.PI) / 2,
      p = point(a),
      end = point(b),
      t0 = tangent(a),
      t1 = tangent(b);
    segments.push({
      c1: { x: p.x + t0.x * radius * k, y: p.y + t0.y * radius * k },
      c2: { x: end.x - t1.x * radius * k, y: end.y - t1.y * radius * k },
      end,
    });
  }
  const tail = Math.min(
    140,
    Math.max(25, Math.hypot(target.x - entry.x, target.y - entry.y) * 0.45),
  );
  segments.push({
    c1: { x: entry.x + u.x * tail, y: entry.y + u.y * tail },
    c2: { x: target.x - u.x * tail * 0.6, y: target.y - u.y * tail * 0.6 },
    end: target,
  });
  return {
    start,
    center,
    radius,
    segments,
    angle: Math.atan2(target.y - segments[5].c2.y, target.x - segments[5].c2.x),
  };
}
