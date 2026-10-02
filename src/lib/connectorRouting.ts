import type { Box } from "./arrowGeometry";
import type { Point, Cubic } from "./loopGeometry";
const inside = (p: Point, b: Box) =>
  p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;
export function segmentHitsBox(a: Point, b: Point, box: Box) {
  const bounds = {
    x: box.x - 6,
    y: box.y - 6,
    width: box.width + 12,
    height: box.height + 12,
  };
  const count = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    if (inside({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, bounds))
      return true;
  }
  return false;
}
export function cubicHitsBoxes(start: Point, segment: Cubic, boxes: Box[]) {
  let previous = start;
  for (let i = 1; i <= 64; i++) {
    const t = i / 64,
      q = 1 - t,
      p = {
        x:
          q * q * q * start.x +
          3 * q * q * t * segment.c1.x +
          3 * q * t * t * segment.c2.x +
          t * t * t * segment.end.x,
        y:
          q * q * q * start.y +
          3 * q * q * t * segment.c1.y +
          3 * q * t * t * segment.c2.y +
          t * t * t * segment.end.y,
      };
    if (boxes.some((box) => segmentHitsBox(previous, p, box))) return true;
    previous = p;
  }
  return false;
}
export function avoidCircle(center: Point, radius: number, boxes: Box[]) {
  let p = { ...center };
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const box of boxes) {
      const gap = radius + 12,
        left = box.x - gap,
        right = box.x + box.width + gap,
        top = box.y - gap,
        bottom = box.y + box.height + gap;
      if (p.x > left && p.x < right && p.y > top && p.y < bottom) {
        const choices = [
          { x: left, y: p.y },
          { x: right, y: p.y },
          { x: p.x, y: top },
          { x: p.x, y: bottom },
        ];
        p = choices.sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )[0];
        changed = true;
      }
    }
    if (!changed) break;
  }
  return p;
}
export function routeConnector(start: Point, end: Point, boxes: Box[]) {
  const active = boxes.filter(
    (box) => !inside(start, box) && !inside(end, box),
  );
  const clear = (a: Point, b: Point) =>
    !active.some((box) => segmentHitsBox(a, b, box));
  if (clear(start, end)) return [start, end];
  const nodes = [
    start,
    end,
    ...active.flatMap((box) => {
      const d = 18;
      return [
        { x: box.x - d, y: box.y - d },
        { x: box.x + box.width + d, y: box.y - d },
        { x: box.x + box.width + d, y: box.y + box.height + d },
        { x: box.x - d, y: box.y + box.height + d },
      ];
    }),
  ];
  const distance = nodes.map(() => Infinity),
    parent = nodes.map(() => -1),
    visited = new Set<number>();
  distance[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++)
      if (
        !visited.has(i) &&
        (current === -1 || distance[i] < distance[current])
      )
        current = i;
    if (current === -1 || distance[current] === Infinity) break;
    if (current === 1) break;
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i) || !clear(nodes[current], nodes[i])) continue;
      const d =
        distance[current] +
        Math.hypot(
          nodes[i].x - nodes[current].x,
          nodes[i].y - nodes[current].y,
        );
      if (d < distance[i]) {
        distance[i] = d;
        parent[i] = current;
      }
    }
  }
  if (parent[1] === -1) return [start, end];
  const path: Point[] = [];
  for (let i = 1; i !== -1; i = parent[i]) path.unshift(nodes[i]);
  return path;
}
type DrawingContext = {
  lineTo: (x: number, y: number) => void;
  quadraticCurveTo: (cx: number, cy: number, x: number, y: number) => void;
};
export function drawRoundedRoute(
  ctx: DrawingContext,
  points: Point[],
  rounded = true,
) {
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i],
      prev = points[i - 1],
      next = points[i + 1],
      a = Math.hypot(p.x - prev.x, p.y - prev.y),
      b = Math.hypot(next.x - p.x, next.y - p.y),
      r = rounded ? Math.min(8, a * 0.2, b * 0.2) : 0;
    if (!r || !a || !b) {
      ctx.lineTo(p.x, p.y);
      continue;
    }
    ctx.lineTo(p.x - ((p.x - prev.x) * r) / a, p.y - ((p.y - prev.y) * r) / a);
    ctx.quadraticCurveTo(
      p.x,
      p.y,
      p.x + ((next.x - p.x) * r) / b,
      p.y + ((next.y - p.y) * r) / b,
    );
  }
  const end = points.at(-1)!;
  ctx.lineTo(end.x, end.y);
}
